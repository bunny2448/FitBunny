
import SwiftUI
import SwiftData
import UniformTypeIdentifiers

enum ImportTier {
    case tier1, tier2, tier3
}

struct ImportInstructionsView: View {
    @Environment(\.dismiss) var dismiss
    @Environment(\.modelContext) var modelContext
    
    // Required queries to check existing data for mapping
    @Query(sort: \Exercise.name) private var existingExercises: [Exercise]
    @Query(sort: \WorkoutTemplate.name) private var existingTemplates: [WorkoutTemplate]
    
    let tier: ImportTier
    
    @State private var isImporting = false
    @State private var importError: String?
    @State private var showingError = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 32) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("INSTRUCTIONAL TEMPLATE")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(.fitOrange)
                            .tracking(2)
                        Text("Prepare your CSV exactly as shown below.")
                            .font(.system(size: 18, weight: .bold))
                    }
                    
                    // ACCEPTED VALUES SECTION
                    VStack(alignment: .leading, spacing: 16) {
                        Text("COLUMN DEFINITIONS")
                            .font(.system(size: 11, weight: .black))
                            .foregroundColor(.fitSecondaryText)
                        
                        VStack(alignment: .leading, spacing: 12) {
                            if tier == .tier1 {
                                ColumnDefRow(title: "NAME", desc: "Required. The exercise name (e.g., Pushups).")
                                ColumnDefRow(title: "DESCRIPTION", desc: "Optional. Instructions for the exercise.")
                                ColumnDefRow(title: "TYPE", desc: "Required. Must be: 'Sets & Reps', 'Time', or 'Sets & Time'.", isHighlighted: true)
                            } else if tier == .tier2 {
                                ColumnDefRow(title: "WORKOUTNAME", desc: "The name of the routine (e.g., Leg Day).")
                                ColumnDefRow(title: "EXERCISENAME", desc: "Must match an existing Name in your Library.")
                                ColumnDefRow(title: "SETS/REPS", desc: "Numbers only.")
                            } else {
                                ColumnDefRow(title: "DATE", desc: "YYYY-MM-DD format.")
                                ColumnDefRow(title: "WORKOUTNAME", desc: "Must match a Routine template name.")
                            }
                        }
                    }
                    
                    VStack(alignment: .leading, spacing: 16) {
                        Text("1. CSV PREVIEW")
                            .font(.system(size: 11, weight: .black))
                            .foregroundColor(.fitSecondaryText)
                        
                        SampleTableView(tier: tier)
                    }
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Exercise names must match exactly across tiers.", systemImage: "exclamationmark.triangle.fill")
                        Label("Date format: YYYY-MM-DD", systemImage: "calendar")
                    }
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.fitOrange)
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.fitOrange.opacity(0.05))
                    .cornerRadius(16)
                    
                    Spacer(minLength: 40)
                    
                    Button {
                        isImporting = true
                    } label: {
                        HStack {
                            Image(systemName: "doc.badge.plus")
                            Text("SELECT CSV FILE")
                        }
                        .font(.system(size: 14, weight: .black))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 20)
                        .background(Color.fitOrange)
                        .foregroundColor(.white)
                        .cornerRadius(24)
                        .shadow(color: .fitOrange.opacity(0.3), radius: 10, y: 5)
                    }
                }
                .padding(32)
            }
            .navigationTitle(navTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }
                }
            }
            .fileImporter(
                isPresented: $isImporting,
                allowedContentTypes: [.commaSeparatedText, .plainText],
                allowsMultipleSelection: false
            ) { result in
                switch result {
                case .success(let urls):
                    if let url = urls.first {
                        handleFileImport(url: url)
                    }
                case .failure(let error):
                    showError("File selection failed: \(error.localizedDescription)")
                }
            }
            .alert("Import Error", isPresented: $showingError) {
                Button("OK", role: .cancel) { }
            } message: {
                if let error = importError {
                    Text(error)
                }
            }
        }
    }
    
    private var navTitle: String {
        switch tier {
        case .tier1: return "Import Exercises"
        case .tier2: return "Import Workouts"
        case .tier3: return "Schedule Plans"
        }
    }
    
    private func showError(_ message: String) {
        importError = message
        showingError = true
    }
    
    private func handleFileImport(url: URL) {
        guard url.startAccessingSecurityScopedResource() else {
            showError("Permission denied to access file.")
            return
        }
        defer { url.stopAccessingSecurityScopedResource() }
        
        do {
            let data = try Data(contentsOf: url)
            guard let content = String(data: data, encoding: .utf8) else {
                showError("Could not read file as UTF-8.")
                return
            }
            
            let rows = parseCSV(content)
            guard rows.count > 1 else {
                showError("CSV is empty or missing headers.")
                return
            }
            
            processRows(rows)
            dismiss()
        } catch {
            showError("Failed to process file: \(error.localizedDescription)")
        }
    }
    
    private func parseCSV(_ content: String) -> [[String]] {
        var result: [[String]] = []
        let lines = content.components(separatedBy: .newlines)
        
        for line in lines where !line.trimmingCharacters(in: .whitespaces).isEmpty {
            // Basic CSV parser handling quoted fields
            var columns: [String] = []
            var currentColumn = ""
            var insideQuotes = false
            
            for char in line {
                if char == "\"" {
                    insideQuotes.toggle()
                } else if char == "," && !insideQuotes {
                    columns.append(currentColumn.trimmingCharacters(in: .whitespaces))
                    currentColumn = ""
                } else {
                    currentColumn.append(char)
                }
            }
            columns.append(currentColumn.trimmingCharacters(in: .whitespaces))
            result.append(columns)
        }
        return result
    }
    
    private func processRows(_ rows: [[String]]) {
        let headers = rows[0].map { $0.lowercased() }
        let dataRows = rows.dropFirst()
        
        switch tier {
        case .tier1:
            importTier1(headers: headers, rows: Array(dataRows))
        case .tier2:
            importTier2(headers: headers, rows: Array(dataRows))
        case .tier3:
            importTier3(headers: headers, rows: Array(dataRows))
        }
    }
    
    private func importTier1(headers: [String], rows: [[String]]) {
        guard let nameIdx = headers.firstIndex(of: "name"),
              let typeIdx = headers.firstIndex(of: "type") else {
            showError("Missing required columns: Name, Type")
            return
        }
        let descIdx = headers.firstIndex(of: "description")
        
        for row in rows where row.count > max(nameIdx, typeIdx) {
            let name = row[nameIdx]
            let typeStr = row[typeIdx]
            let description = descIdx != nil && row.count > descIdx! ? row[descIdx!] : ""
            
            // Avoid duplicates
            if !existingExercises.contains(where: { $0.name.lowercased() == name.lowercased() }) {
                let type: ExerciseType
                switch typeStr.lowercased() {
                case let t where t.contains("time"): type = .time
                case let t where t.contains("sets & time"): type = .setsTime
                default: type = .setsReps
                }
                
                let exercise = Exercise(name: name, desc: description, type: type)
                modelContext.insert(exercise)
            }
        }
    }
    
    private func importTier2(headers: [String], rows: [[String]]) {
        guard let wNameIdx = headers.firstIndex(of: "workoutname"),
              let eNameIdx = headers.firstIndex(of: "exercisename") else {
            showError("Missing required columns: WorkoutName, ExerciseName")
            return
        }
        
        let setsIdx = headers.firstIndex(of: "sets")
        let repsIdx = headers.firstIndex(of: "reps")
        
        // Group rows by WorkoutName
        var workouts: [String: [ExerciseEntry]] = [:]
        
        for row in rows where row.count > max(wNameIdx, eNameIdx) {
            let workoutName = row[wNameIdx]
            let exerciseName = row[eNameIdx]
            
            // Find existing exercise in library
            if let libraryEx = existingExercises.first(where: { $0.name.lowercased() == exerciseName.lowercased() }) {
                let sets = setsIdx != nil && row.count > setsIdx! ? (Int(row[setsIdx!]) ?? 3) : 3
                let reps = repsIdx != nil && row.count > repsIdx! ? (Int(row[repsIdx!]) ?? 10) : 10
                
                let entry = ExerciseEntry(exercise: libraryEx, exerciseName: libraryEx.name, sets: sets, reps: reps)
                
                if workouts[workoutName] == nil {
                    workouts[workoutName] = []
                }
                workouts[workoutName]?.append(entry)
            }
        }
        
        // Save grouped templates
        for (name, entries) in workouts {
            if !existingTemplates.contains(where: { $0.name.lowercased() == name.lowercased() }) {
                let template = WorkoutTemplate(name: name, entries: entries)
                modelContext.insert(template)
            }
        }
    }
    
    private func importTier3(headers: [String], rows: [[String]]) {
        guard let dateIdx = headers.firstIndex(of: "date"),
              let wNameIdx = headers.firstIndex(of: "workoutname") else {
            showError("Missing required columns: Date, WorkoutName")
            return
        }
        
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        
        for row in rows where row.count > max(dateIdx, wNameIdx) {
            let dateStr = row[dateIdx]
            let workoutName = row[wNameIdx]
            
            if let date = formatter.date(from: dateStr),
               let template = existingTemplates.first(where: { $0.name.lowercased() == workoutName.lowercased() }) {
                let scheduled = ScheduledWorkout(date: date, template: template)
                modelContext.insert(scheduled)
            }
        }
    }
}

struct ColumnDefRow: View {
    let title: String
    let desc: String
    var isHighlighted: Bool = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 9, weight: .black))
                .foregroundColor(isHighlighted ? .fitOrange : .primary)
            Text(desc)
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.fitSecondaryText)
        }
        .padding(.leading, 8)
        .overlay(
            Rectangle()
                .fill(isHighlighted ? Color.fitOrange : Color.fitSecondaryText.opacity(0.3))
                .frame(width: 2),
            alignment: .leading
        )
    }
}

struct SampleTableView: View {
    let tier: ImportTier
    
    var headers: [String] {
        switch tier {
        case .tier1: return ["Name", "Description", "Type"]
        case .tier2: return ["WorkoutName", "ExerciseName", "Sets", "Reps"]
        case .tier3: return ["Date", "WorkoutName"]
        }
    }
    
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                ForEach(headers, id: \.self) { h in
                    Text(h)
                        .font(.system(size: 9, weight: .black))
                        .foregroundColor(.fitSecondaryText)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .padding()
            .background(Color.black.opacity(0.05))
            
            VStack(spacing: 0) {
                SampleRow(tier: tier, index: 0)
                Divider()
                SampleRow(tier: tier, index: 1)
            }
        }
        .background(Color.white)
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.black.opacity(0.05)))
    }
}

struct SampleRow: View {
    let tier: ImportTier
    let index: Int
    
    var body: some View {
        HStack {
            if tier == .tier1 {
                Text(index == 0 ? "Pushups" : "Plank").sampleText()
                Text(index == 0 ? "Hands shoulder width..." : "Hold core...").sampleText()
                Text(index == 0 ? "Sets & Reps" : "Time").sampleText()
                    .foregroundColor(.fitOrange)
                    .fontWeight(.bold)
            } else if tier == .tier2 {
                Text("Leg Day").sampleText()
                Text(index == 0 ? "Squat" : "Lunges").sampleText()
                Text("3").sampleText()
                Text("12").sampleText()
            } else {
                Text("2024-03-20").sampleText()
                Text("Leg Day").sampleText()
            }
        }
        .padding()
    }
}

extension Text {
    func sampleText() -> some View {
        self.font(.system(size: 10, weight: .medium, design: .monospaced))
            .frame(maxWidth: .infinity, alignment: .leading)
            .lineLimit(1)
    }
}

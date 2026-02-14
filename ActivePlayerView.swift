
import SwiftUI
import SwiftData
import AVKit
import AVFoundation

struct ActivePlayerView: View {
    @Environment(\.dismiss) var dismiss
    @Environment(\.modelContext) var modelContext
    @Query(sort: \WorkoutLog.date, order: .reverse) private var allLogs: [WorkoutLog]
    
    let template: WorkoutTemplate
    
    @State private var durationSeconds = 0
    @State private var isRatingView = false
    @State private var showingVideoUrl: URL? = nil
    @State private var expandedDescriptions: Set<Int> = [] 
    
    // Per-exercise timer state
    @State private var exerciseTimers: [Int: Int] = [:]
    @State private var activeTimerIndices: Set<Int> = []

    // Performance data storage
    @State private var setWeights: [Int: [Int: String]] = [:]
    @State private var setReps: [Int: [Int: String]] = [:]
    @State private var setTimes: [Int: [Int: String]] = [:]
    @State private var userEditedFields: Set<String> = [] 
    
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        ZStack {
            Color.fitBackground.ignoresSafeArea()
            
            if isRatingView {
                RatingModal(onComplete: completeWorkout)
            } else {
                VStack(spacing: 0) {
                    // Sticky Header
                    VStack(spacing: 12) {
                        HStack {
                            Button { dismiss() } label: {
                                Image(systemName: "xmark")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(.fitSecondaryText)
                            }
                            Spacer()
                            Text(timeString(durationSeconds))
                                .font(.system(.title2, design: .monospaced))
                                .fontWeight(.black)
                                .foregroundColor(.fitOrange)
                            Spacer()
                            Button { isRatingView = true } label: {
                                Text("FINISH")
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(Color.fitOrange)
                                    .clipShape(Capsule())
                            }
                        }
                        .padding(.top, 8)
                        
                        // Progress Header
                        HStack(spacing: 4) {
                            ForEach(0..<template.entries.count, id: \.self) { _ in
                                Rectangle()
                                    .fill(Color.fitOrange.opacity(0.3))
                                    .frame(height: 3)
                                    .cornerRadius(1)
                            }
                        }
                    }
                    .padding(.horizontal)
                    .background(Color.fitBackground)
                    
                    // Continuous List of Exercises
                    ScrollView {
                        VStack(spacing: 32) {
                            ForEach(0..<template.entries.count, id: \.self) { exIndex in
                                exerciseSection(for: template.entries[exIndex], at: exIndex)
                            }
                            
                            VStack(spacing: 20) {
                                Text("END OF ROUTINE")
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundColor(.fitSecondaryText)
                                    .tracking(2)
                                
                                Button { isRatingView = true } label: {
                                    HStack {
                                        Text("FINISH SESSION")
                                        Image(systemName: "checkmark.circle.fill")
                                    }
                                    .font(.system(size: 14, weight: .black))
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 24)
                                    .background(Color.fitOrange)
                                    .foregroundColor(.white)
                                    .cornerRadius(24)
                                }
                            }
                            .padding(.top, 40)
                            .padding(.bottom, 100)
                            .padding(.horizontal, 32)
                        }
                    }
                }
            }
        }
        .onAppear {
            performAutofillForAll()
        }
        .onReceive(timer) { _ in
            durationSeconds += 1
            
            // Manage multiple timers
            for idx in activeTimerIndices {
                if let current = exerciseTimers[idx], current > 0 {
                    exerciseTimers[idx] = current - 1
                    if exerciseTimers[idx] == 0 {
                        AudioServicesPlaySystemSound(1007)
                        activeTimerIndices.remove(idx)
                    }
                }
            }
        }
        .sheet(item: Binding(
            get: { showingVideoUrl.map { IdentifiableURL(url: $0) } },
            set: { showingVideoUrl = $0?.url }
        )) { identURL in
            VideoOverlayContainer(url: identURL.url)
        }
    }
    
    struct IdentifiableURL: Identifiable {
        let url: URL
        var id: String { url.absoluteString }
    }
    
    @ViewBuilder
    private func exerciseSection(for entry: ExerciseEntry, at exIndex: Int) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            // Exercise Header Info
            VStack(alignment: .leading, spacing: 8) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack(spacing: 8) {
                            Text(entry.exerciseName)
                                .font(.system(size: 22, weight: .black, design: .rounded))
                                .foregroundColor(.primary)
                            
                            if entry.isSuperset {
                                Text("SUPERSET")
                                    .font(.system(size: 8, weight: .black))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 3)
                                    .background(Color.fitOrange)
                                    .cornerRadius(6)
                            }
                        }
                        Text("\(entry.sets) SETS • \(entry.reps > 0 ? "\(entry.reps) REPS" : entry.time)")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(.fitSecondaryText)
                            .tracking(1)
                    }
                    Spacer()
                    
                    HStack(spacing: 12) {
                        Button {
                            withAnimation(.spring()) {
                                if expandedDescriptions.contains(exIndex) {
                                    expandedDescriptions.remove(exIndex)
                                } else {
                                    expandedDescriptions.insert(exIndex)
                                }
                            }
                        } label: {
                            Image(systemName: "info.circle")
                                .font(.system(size: 20))
                                .foregroundColor(expandedDescriptions.contains(exIndex) ? .fitOrange : .fitSecondaryText)
                        }
                        
                        if let exercise = entry.exercise, let fileName = exercise.videoFileName,
                           let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.appendingPathComponent(fileName) {
                            Button { showingVideoUrl = url } label: {
                                Image(systemName: "video.fill")
                                    .font(.system(size: 20))
                                    .foregroundColor(.fitOrange)
                            }
                        }
                    }
                }
                
                if expandedDescriptions.contains(exIndex), let desc = entry.exercise?.desc, !desc.isEmpty {
                    Text(desc)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.fitSecondaryText)
                        .padding(12)
                        .background(Color.black.opacity(0.03))
                        .cornerRadius(12)
                }

                // Individual Rest Timer Button
                if entry.restTime > 0 {
                    let isTimerActive = activeTimerIndices.contains(exIndex)
                    let timeLeft = exerciseTimers[exIndex] ?? entry.restTime
                    
                    Button {
                        if isTimerActive {
                            activeTimerIndices.remove(exIndex)
                            exerciseTimers[exIndex] = entry.restTime
                        } else {
                            exerciseTimers[exIndex] = entry.restTime
                            activeTimerIndices.insert(exIndex)
                        }
                    } label: {
                        HStack {
                            Image(systemName: "timer")
                            Text(isTimerActive ? "RESTING: \(timeLeft)s" : "START REST (\(entry.restTime)s)")
                                .fontWeight(.black)
                        }
                        .font(.system(size: 10))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(isTimerActive ? Color.black : Color.white)
                        .foregroundColor(isTimerActive ? .white : .fitOrange)
                        .cornerRadius(16)
                        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.fitOrange, lineWidth: isTimerActive ? 0 : 1))
                    }
                    .padding(.top, 4)
                }
            }
            .padding(.horizontal)
            
            // Tracking Fields
            VStack(spacing: 12) {
                let type = entry.exercise?.type ?? .setsReps
                
                // HEADER LABELS FOR ACTIVE TRACKING
                HStack(spacing: 12) {
                   Text("#").font(.system(size: 8, weight: .black)).foregroundColor(.fitSecondaryText).frame(width: 30, alignment: .leading)
                   if type == .setsReps {
                       Text("WEIGHT (KG)").font(.system(size: 8, weight: .black)).foregroundColor(.fitSecondaryText)
                       Spacer()
                       Text("REPS").font(.system(size: 8, weight: .black)).foregroundColor(.fitSecondaryText).frame(width: 80, alignment: .trailing)
                   } else {
                       Text("TIME / DURATION").font(.system(size: 8, weight: .black)).foregroundColor(.fitSecondaryText)
                   }
                }
                .padding(.horizontal, 20)

                if type == .time {
                    HStack(spacing: 16) {
                        Image(systemName: "hourglass")
                            .font(.system(size: 14, weight: .black))
                            .frame(width: 30, alignment: .leading)
                            .foregroundColor(.fitSecondaryText)
                        
                        TextField("0s", text: binding(for: exIndex, setIndex: 0, field: .time))
                            .font(.system(size: 24, weight: .black, design: .rounded))
                            .foregroundColor(isAutofilled(exIndex: exIndex, setIndex: 0, field: .time) ? .fitSecondaryText.opacity(0.5) : .primary)
                            .padding()
                            .background(Color.white)
                            .cornerRadius(16)
                            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.black.opacity(0.05)))
                    }
                    .padding(.horizontal)
                } else {
                    ForEach(0..<entry.sets, id: \.self) { setIndex in
                        HStack(spacing: 12) {
                            Text("\(setIndex + 1)")
                                .font(.system(size: 14, weight: .black))
                                .frame(width: 30, alignment: .leading)
                                .foregroundColor(.fitSecondaryText)
                            
                            TextField("0", text: binding(for: exIndex, setIndex: setIndex, field: .weight))
                                .keyboardType(.decimalPad)
                                .font(.system(size: 18, weight: .black, design: .rounded))
                                .foregroundColor(isAutofilled(exIndex: exIndex, setIndex: setIndex, field: .weight) ? .fitSecondaryText.opacity(0.5) : .primary)
                                .padding(14)
                                .background(Color.white)
                                .cornerRadius(12)
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.black.opacity(0.05)))
                            
                            TextField("0", text: binding(for: exIndex, setIndex: setIndex, field: .reps))
                                .keyboardType(.numberPad)
                                .font(.system(size: 18, weight: .black, design: .rounded))
                                .foregroundColor(isAutofilled(exIndex: exIndex, setIndex: setIndex, field: .reps) ? .fitOrange.opacity(0.4) : .fitOrange)
                                .multilineTextAlignment(.trailing)
                                .padding(14)
                                .background(Color.white)
                                .cornerRadius(12)
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.black.opacity(0.05)))
                                .frame(width: 80)
                        }
                        .padding(.horizontal)
                    }
                }
            }
        }
        .padding(.vertical, 12)
    }
    
    private func performAutofillForAll() {
        for (exIndex, entry) in template.entries.enumerated() {
            let logs = allLogs.filter { $0.exerciseLogs.contains { $0.exerciseName == entry.exerciseName } }
            guard let lastLog = logs.first else { continue }
            guard let exLog = lastLog.exerciseLogs.first(where: { $0.exerciseName == entry.exerciseName }) else { continue }
            
            var weights: [Int: String] = [:]
            var reps: [Int: String] = [:]
            var times: [Int: String] = [:]
            
            for (setIndex, set) in exLog.sets.enumerated() {
                if setIndex < entry.sets {
                    weights[setIndex] = "\(Int(set.weight))"
                    reps[setIndex] = "\(set.reps)"
                    times[setIndex] = set.time
                }
            }
            
            setWeights[exIndex] = weights
            setReps[exIndex] = reps
            setTimes[exIndex] = times
        }
    }
    
    enum FieldType { case weight, reps, time }
    
    private func isAutofilled(exIndex: Int, setIndex: Int, field: FieldType) -> Bool {
        let fieldCode = switch field { case .weight: "w" case .reps: "r" case .time: "t" }
        let key = "\(exIndex)-\(setIndex)-\(fieldCode)"
        return !userEditedFields.contains(key)
    }
    
    private func binding(for exIndex: Int, setIndex: Int, field: FieldType) -> Binding<String> {
        return Binding(
            get: {
                switch field {
                case .weight: return setWeights[exIndex]?[setIndex] ?? ""
                case .reps: return setReps[exIndex]?[setIndex] ?? ""
                case .time: return setTimes[exIndex]?[setIndex] ?? ""
                }
            },
            set: { newValue in
                let fieldCode = switch field { case .weight: "w" case .reps: "r" case .time: "t" }
                userEditedFields.insert("\(exIndex)-\(setIndex)-\(fieldCode)")
                switch field {
                case .weight: if setWeights[exIndex] == nil { setWeights[exIndex] = [:] }; setWeights[exIndex]?[setIndex] = newValue
                case .reps: if setReps[exIndex] == nil { setReps[exIndex] = [:] }; setReps[exIndex]?[setIndex] = newValue
                case .time: if setTimes[exIndex] == nil { setTimes[exIndex] = [:] }; setTimes[exIndex]?[setIndex] = newValue
                }
            }
        )
    }
    
    private func timeString(_ s: Int) -> String {
        let m = s / 60
        let sec = s % 60
        return String(format: "%02d:%02d", m, sec)
    }
    
    func completeWorkout(rating: String) {
        var exerciseLogs: [ExerciseLog] = []
        for (idx, entry) in template.entries.enumerated() {
            var sets: [SetLog] = []
            let weights = setWeights[idx] ?? [:]
            let reps = setReps[idx] ?? [:]
            let times = setTimes[idx] ?? [:]
            let setLimit = entry.exercise?.type == .time ? 1 : entry.sets
            for setIdx in 0..<setLimit {
                let w = Double(weights[setIdx] ?? "0") ?? 0
                let r = Int(reps[setIdx] ?? "0") ?? 0
                let t = times[setIdx] ?? ""
                sets.append(SetLog(weight: w, reps: r, time: t))
            }
            let exerciseId = entry.exercise?.id.uuidString ?? UUID().uuidString
            exerciseLogs.append(ExerciseLog(exerciseName: entry.exerciseName, exerciseId: exerciseId, sets: sets))
        }
        modelContext.insert(WorkoutLog(date: Date(), workoutName: template.name, rating: rating, durationSeconds: durationSeconds, exerciseLogs: exerciseLogs))
        dismiss()
    }
}

struct RatingModal: View {
    let onComplete: (String) -> Void
    let ratings = ["Super Easy", "Easy", "Moderate", "Hard", "Very Hard"]
    
    var body: some View {
        VStack(spacing: 32) {
            ZStack {
                Circle().fill(Color.fitOrange.opacity(0.1)).frame(width: 100, height: 100)
                Image(systemName: "trophy.fill").font(.system(size: 40)).foregroundColor(.fitOrange)
            }
            
            VStack(spacing: 8) {
                Text("Great Session!")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                Text("How was the intensity today?")
                    .font(.subheadline)
                    .foregroundColor(.fitSecondaryText)
            }
            
            VStack(spacing: 12) {
                ForEach(ratings, id: \.self) { rating in
                    Button {
                        onComplete(rating)
                    } label: {
                        Text(rating.uppercased())
                            .font(.system(size: 12, weight: .black))
                            .tracking(1)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 20)
                            .background(Color.white)
                            .foregroundColor(.primary)
                            .cornerRadius(20)
                            .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.black.opacity(0.05)))
                    }
                }
            }
            .padding(.horizontal, 32)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.fitBackground)
    }
}

struct VideoOverlayContainer: View {
    let url: URL
    @State private var player: AVPlayer
    
    init(url: URL) {
        self.url = url
        // Initialize player only once using the stable URL provided.
        self._player = State(initialValue: AVPlayer(url: url))
    }
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            VideoPlayer(player: player)
                .onAppear { 
                    // Seek to beginning and play to ensure it starts cleanly
                    player.seek(to: .zero)
                    player.play() 
                }
                .onDisappear { 
                    player.pause() 
                }
        }
    }
}

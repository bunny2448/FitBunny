import SwiftUI
import SwiftData
import PhotosUI
import AVKit

struct ExercisesView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Exercise.name) private var exercises: [Exercise]
    @State private var searchText = ""
    @State private var showingAddModal = false
    @State private var showingImportModal = false
    
    var filteredExercises: [Exercise] {
        if searchText.isEmpty { return exercises }
        return exercises.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
    }
    
    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottomTrailing) {
                Color.fitBackground.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    BrandingHeader()
                    
                    HStack(spacing: 12) {
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(.fitSecondaryText)
                            TextField("Filter exercises...", text: $searchText)
                                .font(.system(size: 14, weight: .medium))
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(Color.white)
                        .cornerRadius(20)
                        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.black.opacity(0.05)))
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 16)
                    
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            if filteredExercises.isEmpty {
                                Text("No exercises found.")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.fitSecondaryText)
                                    .padding(.top, 100)
                            } else {
                                ForEach(filteredExercises) { exercise in
                                    ExerciseCard(exercise: exercise)
                                }
                            }
                        }
                        .padding()
                        .padding(.bottom, 80) // Add padding so the FAB doesn't cover content
                    }
                }

                // High-fidelity Floating Action Button
                Button {
                    showingAddModal = true
                } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.white)
                        .frame(width: 64, height: 64)
                        .background(Color.fitOrange)
                        .clipShape(Circle())
                        .shadow(color: .fitOrange.opacity(0.4), radius: 12, x: 0, y: 6)
                }
                .padding(.trailing, 24)
                .padding(.bottom, 24)
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingImportModal = true
                    } label: {
                        Text("IMPORT")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(.fitOrange)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.fitOrange.opacity(0.1))
                            .clipShape(Capsule())
                    }
                }
            }
            .sheet(isPresented: $showingAddModal) {
                AddExerciseSheet()
            }
            .sheet(isPresented: $showingImportModal) {
                ImportInstructionsView(tier: .tier1)
            }
        }
    }
}

struct ExerciseCard: View {
    @Environment(\.modelContext) private var modelContext
    let exercise: Exercise
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                    isExpanded.toggle()
                }
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(exercise.name)
                            .font(.system(size: 18, weight: .black, design: .rounded))
                            .foregroundColor(.primary)
                        Text(exercise.type.rawValue.uppercased())
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(.fitSecondaryText)
                            .tracking(1.5)
                    }
                    Spacer()
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundColor(isExpanded ? .fitOrange : .fitSecondaryText)
                        .font(.system(size: 14, weight: .bold))
                }
                .padding(24)
            }
            
            if isExpanded {
                VStack(alignment: .leading, spacing: 16) {
                    if let fileName = exercise.videoFileName,
                       let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.appendingPathComponent(fileName) {
                        VideoPlayer(player: AVPlayer(url: url))
                            .frame(height: 200)
                            .cornerRadius(16)
                            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.black.opacity(0.05)))
                    }
                    
                    Text(exercise.desc.isEmpty ? "No instructions provided." : exercise.desc)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.primary.opacity(0.7))
                        .lineSpacing(4)
                    
                    Divider()
                    
                    HStack {
                        Spacer()
                        Button(role: .destructive) {
                            modelContext.delete(exercise)
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "trash")
                                Text("REMOVE EXERCISE")
                            }
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(.red)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.red.opacity(0.05))
                            .clipShape(Capsule())
                        }
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
            }
        }
        .background(Color.white)
        .cornerRadius(24)
        .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.black.opacity(0.05)))
        .shadow(color: Color.black.opacity(0.02), radius: 10, y: 5)
    }
}

struct AddExerciseSheet: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    @State private var name = ""
    @State private var desc = ""
    @State private var type = ExerciseType.setsReps
    @State private var videoItem: PhotosPickerItem?
    @State private var videoFileName: String?
    
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Exercise Name (e.g. Squat)", text: $name)
                    Picker("Tracking Type", selection: $type) {
                        ForEach(ExerciseType.allCases, id: \.self) { type in
                            Text(type.rawValue).tag(type)
                        }
                    }
                } header: { Text("DETAILS").font(.system(size: 10, weight: .black)) }
                
                Section {
                    TextEditor(text: $desc)
                        .frame(minHeight: 100)
                } header: { Text("DESCRIPTION").font(.system(size: 10, weight: .black)) }
                
                Section {
                    PhotosPicker(selection: $videoItem, matching: .videos) {
                        HStack {
                            Image(systemName: "video.fill")
                            Text(videoFileName == nil ? "Select Reference Video" : "Video Selected")
                        }
                        .foregroundColor(.fitOrange)
                    }
                } header: { Text("MEDIA").font(.system(size: 10, weight: .black)) }
            }
            .navigationTitle("New Exercise")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let exercise = Exercise(name: name, desc: desc, type: type, videoFileName: videoFileName)
                        modelContext.insert(exercise)
                        dismiss()
                    }
                    .disabled(name.isEmpty)
                }
            }
            .onChange(of: videoItem) { oldValue, newValue in
                Task {
                    if let data = try? await newValue?.loadTransferable(type: Data.self) {
                        let fileName = "\(UUID().uuidString).mov"
                        if let url = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.appendingPathComponent(fileName) {
                            try? data.write(to: url)
                            videoFileName = fileName
                        }
                    }
                }
            }
        }
    }
}

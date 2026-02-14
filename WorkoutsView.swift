
import SwiftUI
import SwiftData

struct WorkoutsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \WorkoutTemplate.name) private var templates: [WorkoutTemplate]
    @State private var showingAddModal = false
    @State private var showingImportModal = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color.fitBackground.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    BrandingHeader()
                    
                    HStack {
                        Text("MY ROUTINES")
                            .font(.system(size: 11, weight: .black))
                            .foregroundColor(.fitSecondaryText)
                            .tracking(2)
                        Spacer()
                        Button {
                            showingAddModal = true
                        } label: {
                            Image(systemName: "plus.circle.fill")
                                .font(.title2)
                                .foregroundColor(.fitOrange)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 12)
                    
                    ScrollView {
                        if templates.isEmpty {
                            VStack(spacing: 20) {
                                Image(systemName: "list.bullet.clipboard")
                                    .font(.system(size: 60))
                                    .foregroundColor(.fitSecondaryText.opacity(0.2))
                                Text("No workout routines created.")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.fitSecondaryText)
                                Button { showingAddModal = true } label: {
                                    Text("CREATE NEW")
                                        .font(.system(size: 12, weight: .black))
                                        .foregroundColor(.white)
                                        .padding(.horizontal, 24)
                                        .padding(.vertical, 12)
                                        .background(Color.fitOrange)
                                        .cornerRadius(20)
                                }
                            }
                            .padding(.top, 100)
                        } else {
                            LazyVStack(spacing: 12) {
                                ForEach(templates) { template in
                                    WorkoutCard(template: template)
                                }
                            }
                            .padding()
                        }
                    }
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showingImportModal = true } label: {
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
                AddWorkoutSheet()
            }
            .sheet(isPresented: $showingImportModal) {
                ImportInstructionsView(tier: .tier2)
            }
        }
    }
}

struct WorkoutCard: View {
    @Environment(\.modelContext) private var modelContext
    let template: WorkoutTemplate
    @State private var isExpanded = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(.spring()) { isExpanded.toggle() }
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(template.name)
                            .font(.system(size: 18, weight: .black, design: .rounded))
                            .foregroundColor(.primary)
                        Text("\(template.entries.count) EXERCISES")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(.fitSecondaryText)
                            .tracking(1)
                    }
                    Spacer()
                    Image(systemName: isExpanded ? "chevron.down" : "chevron.right")
                        .foregroundColor(isExpanded ? .fitOrange : .fitSecondaryText)
                }
                .padding(24)
            }
            
            if isExpanded {
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(template.entries) { entry in
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                HStack(spacing: 6) {
                                    Text(entry.exerciseName)
                                        .font(.system(size: 14, weight: .bold))
                                    if entry.isSuperset {
                                        Text("SUPERSET")
                                            .font(.system(size: 8, weight: .black))
                                            .foregroundColor(.fitOrange)
                                            .padding(.horizontal, 4)
                                            .padding(.vertical, 2)
                                            .background(Color.fitOrange.opacity(0.1))
                                            .cornerRadius(4)
                                    }
                                }
                                Text("\(entry.sets) SETS • \(entry.restTime)s REST")
                                    .font(.system(size: 9, weight: .black))
                                    .foregroundColor(.fitSecondaryText)
                            }
                            Spacer()
                            Text(entry.reps > 0 ? "\(entry.reps) REPS" : entry.time)
                                .font(.system(size: 12, weight: .black))
                                .foregroundColor(.fitSecondaryText)
                        }
                        .padding(12)
                        .background(Color.fitBackground)
                        .cornerRadius(12)
                    }
                    
                    HStack {
                        Spacer()
                        Button(role: .destructive) {
                            modelContext.delete(template)
                        } label: {
                            Label("DELETE WORKOUT", systemImage: "trash")
                                .font(.system(size: 10, weight: .black))
                                .padding(.top, 12)
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

struct AddWorkoutSheet: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \Exercise.name) private var exercises: [Exercise]
    
    @State private var name = ""
    @State private var selectedEntries: [ExerciseEntry] = []
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Form {
                    Section {
                        TextField("e.g. Upper Body Burn", text: $name)
                    } header: { Text("WORKOUT NAME").font(.system(size: 10, weight: .black)) }
                    
                    Section {
                        ForEach(exercises) { exercise in
                            let isSelected = selectedEntries.contains(where: { $0.exerciseName == exercise.name })
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Button {
                                    if isSelected {
                                        selectedEntries.removeAll(where: { $0.exerciseName == exercise.name })
                                    } else {
                                        let entry = ExerciseEntry(exercise: exercise, exerciseName: exercise.name)
                                        if exercise.type == .time {
                                            entry.sets = 1
                                            entry.time = "60s"
                                            entry.reps = 0
                                        } else if exercise.type == .setsTime {
                                            entry.sets = 3
                                            entry.time = "30s"
                                            entry.reps = 0
                                        }
                                        selectedEntries.append(entry)
                                    }
                                } label: {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text(exercise.name)
                                                .font(.system(size: 15, weight: .bold))
                                                .foregroundColor(.primary)
                                            Text(exercise.type.rawValue.uppercased())
                                                .font(.system(size: 8, weight: .black))
                                                .foregroundColor(.fitSecondaryText)
                                        }
                                        Spacer()
                                        Image(systemName: isSelected ? "checkmark.circle.fill" : "plus.circle")
                                            .foregroundColor(isSelected ? .fitOrange : .fitSecondaryText)
                                    }
                                }
                                
                                if isSelected, let index = selectedEntries.firstIndex(where: { $0.exerciseName == exercise.name }) {
                                    VStack(alignment: .leading, spacing: 12) {
                                        
                                        // DYNAMIC INPUT FIELDS FOR WORKOUT CREATION
                                        if exercise.type == .setsReps {
                                            HStack(spacing: 20) {
                                                VStack(alignment: .leading, spacing: 2) {
                                                    Text("SETS").font(.system(size: 8, weight: .black)).foregroundColor(.fitSecondaryText)
                                                    TextField("3", value: Binding(
                                                        get: { selectedEntries[index].sets },
                                                        set: { selectedEntries[index].sets = $0 }
                                                    ), format: .number)
                                                    .keyboardType(.numberPad)
                                                    .font(.system(size: 14, weight: .bold))
                                                    .padding(8)
                                                    .frame(width: 80)
                                                    .background(Color.black.opacity(0.05))
                                                    .cornerRadius(10)
                                                }
                                                
                                                VStack(alignment: .leading, spacing: 2) {
                                                    Text("TARGET REPS").font(.system(size: 8, weight: .black)).foregroundColor(.fitSecondaryText)
                                                    TextField("10", value: Binding(
                                                        get: { selectedEntries[index].reps },
                                                        set: { selectedEntries[index].reps = $0 }
                                                    ), format: .number)
                                                    .keyboardType(.numberPad)
                                                    .font(.system(size: 14, weight: .bold))
                                                    .padding(8)
                                                    .frame(width: 80)
                                                    .background(Color.black.opacity(0.05))
                                                    .cornerRadius(10)
                                                }
                                            }
                                        } else if exercise.type == .time {
                                            VStack(alignment: .leading, spacing: 2) {
                                                Text("DURATION").font(.system(size: 8, weight: .black)).foregroundColor(.fitSecondaryText)
                                                TextField("e.g. 60s", text: Binding(
                                                    get: { selectedEntries[index].time },
                                                    set: { selectedEntries[index].time = $0 }
                                                ))
                                                .font(.system(size: 14, weight: .bold))
                                                .padding(8)
                                                .frame(maxWidth: .infinity)
                                                .background(Color.black.opacity(0.05))
                                                .cornerRadius(10)
                                            }
                                        } else if exercise.type == .setsTime {
                                            HStack(spacing: 20) {
                                                VStack(alignment: .leading, spacing: 2) {
                                                    Text("SETS").font(.system(size: 8, weight: .black)).foregroundColor(.fitSecondaryText)
                                                    TextField("3", value: Binding(
                                                        get: { selectedEntries[index].sets },
                                                        set: { selectedEntries[index].sets = $0 }
                                                    ), format: .number)
                                                    .keyboardType(.numberPad)
                                                    .font(.system(size: 14, weight: .bold))
                                                    .padding(8)
                                                    .frame(width: 80)
                                                    .background(Color.black.opacity(0.05))
                                                    .cornerRadius(10)
                                                }
                                                
                                                VStack(alignment: .leading, spacing: 2) {
                                                    Text("DURATION / SET").font(.system(size: 8, weight: .black)).foregroundColor(.fitSecondaryText)
                                                    TextField("e.g. 30s", text: Binding(
                                                        get: { selectedEntries[index].time },
                                                        set: { selectedEntries[index].time = $0 }
                                                    ))
                                                    .font(.system(size: 14, weight: .bold))
                                                    .padding(8)
                                                    .frame(maxWidth: .infinity)
                                                    .background(Color.black.opacity(0.05))
                                                    .cornerRadius(10)
                                                }
                                            }
                                        }
                                        
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text("REST TIME: \(selectedEntries[index].restTime)s").font(.system(size: 8, weight: .black)).foregroundColor(.fitSecondaryText)
                                            Stepper(value: Binding(
                                                get: { selectedEntries[index].restTime },
                                                set: { selectedEntries[index].restTime = $0 }
                                            ), in: 0...300, step: 5) {
                                                Text("\(selectedEntries[index].restTime)s")
                                            }
                                            .labelsHidden()
                                        }

                                        Toggle(isOn: Binding(
                                            get: { selectedEntries[index].isSuperset },
                                            set: { selectedEntries[index].isSuperset = $0 }
                                        )) {
                                            Text("SUPERSET")
                                                .font(.system(size: 10, weight: .black))
                                                .foregroundColor(.fitSecondaryText)
                                        }
                                        .toggleStyle(SwitchToggleStyle(tint: .fitOrange))
                                        .padding(.top, 4)
                                    }
                                    .padding(.top, 4)
                                    .padding(.bottom, 8)
                                    .transition(.opacity.combined(with: .move(edge: .top)))
                                }
                            }
                            .padding(.vertical, 8)
                        }
                    } header: { Text("SELECT & CONFIGURE").font(.system(size: 10, weight: .black)) }
                }
                
                if !selectedEntries.isEmpty {
                    VStack(spacing: 12) {
                        Text("ROUTINE PREVIEW (\(selectedEntries.count))")
                            .font(.system(size: 10, weight: .black))
                            .foregroundColor(.fitSecondaryText)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(selectedEntries) { entry in
                                    Text("\(entry.exerciseName): \(entry.sets)x\(entry.reps > 0 ? "\(entry.reps)" : entry.time) (\(entry.restTime)s)")
                                        .font(.system(size: 12, weight: .bold))
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(Color.fitOrange.opacity(0.1))
                                        .foregroundColor(.fitOrange)
                                        .cornerRadius(10)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding(.vertical)
                    .background(Color.white)
                    .overlay(Divider(), alignment: .top)
                }
            }
            .navigationTitle("New Workout Template")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let template = WorkoutTemplate(name: name, entries: selectedEntries)
                        modelContext.insert(template)
                        dismiss()
                    }
                    .disabled(name.isEmpty || selectedEntries.isEmpty)
                }
            }
        }
    }
}

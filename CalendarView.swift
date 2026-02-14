import SwiftUI
import SwiftData

struct CalendarView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var scheduledWorkouts: [ScheduledWorkout]
    @Query private var templates: [WorkoutTemplate]
    
    @State private var selectedDate = Date()
    @State private var activeWorkout: WorkoutTemplate?
    @State private var showingAssignSheet = false
    @State private var showingBulkImport = false
    
    var scheduleForSelectedDate: [ScheduledWorkout] {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dateString = formatter.string(from: selectedDate)
        return scheduledWorkouts.filter { $0.dateString == dateString }
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color.fitBackground.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    BrandingHeader()
                    
                    WeekStripView(selectedDate: $selectedDate, workouts: scheduledWorkouts)
                        .padding(.bottom, 24)
                    
                    VStack(alignment: .leading, spacing: 16) {
                        HStack(spacing: 12) {
                            Text(selectedDate.formatted(date: .long, time: .omitted).uppercased())
                                .font(.system(size: 11, weight: .black))
                                .foregroundColor(.fitSecondaryText)
                                .tracking(2)
                            Spacer()
                            Button { showingAssignSheet = true } label: {
                                Text("ASSIGN PLAN")
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundColor(.fitOrange)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Color.fitOrange.opacity(0.1))
                                    .clipShape(Capsule())
                            }
                            Button { showingBulkImport = true } label: {
                                Text("BULK IMPORT")
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundColor(.fitOrange)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Color.fitOrange.opacity(0.1))
                                    .clipShape(Capsule())
                            }
                        }
                        .padding(.horizontal)
                        
                        ScrollView {
                            if scheduleForSelectedDate.isEmpty {
                                VStack(spacing: 12) {
                                    Image(systemName: "calendar.badge.plus")
                                        .font(.largeTitle)
                                        .foregroundColor(.fitSecondaryText.opacity(0.3))
                                    Text("Nothing planned for today.")
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundColor(.fitSecondaryText)
                                }
                                .padding(.top, 60)
                            } else {
                                LazyVStack(spacing: 12) {
                                    ForEach(scheduleForSelectedDate) { schedule in
                                        ScheduledRow(scheduled: schedule) {
                                            activeWorkout = schedule.template
                                        }
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                    }
                }
            }
            .sheet(isPresented: $showingAssignSheet) {
                AssignWorkoutSheet(selectedDate: selectedDate)
            }
            .sheet(isPresented: $showingBulkImport) {
                ImportInstructionsView(tier: .tier3)
            }
            .fullScreenCover(item: $activeWorkout) { template in
                ActivePlayerView(template: template)
            }
        }
    }
}

struct WeekStripView: View {
    @Binding var selectedDate: Date
    let workouts: [ScheduledWorkout]
    
    // Generate a wider range for better scrolling experience
    var dates: [Date] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        return (-14...14).compactMap { offset in
            calendar.date(byAdding: .day, value: offset, to: today)
        }
    }
    
    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(dates, id: \.self) { date in
                        let isSelected = Calendar.current.isDate(date, inSameDayAs: selectedDate)
                        let hasWorkouts = hasWorkoutsOn(date)
                        
                        Button {
                            withAnimation(.spring()) {
                                selectedDate = date
                            }
                        } label: {
                            VStack(spacing: 8) {
                                Text(date.formatted(.dateTime.weekday(.narrow)))
                                    .font(.system(size: 10, weight: .black))
                                    .foregroundColor(isSelected ? .white.opacity(0.8) : .fitSecondaryText)
                                Text(date.formatted(.dateTime.day()))
                                    .font(.system(size: 20, weight: .black, design: .rounded))
                                    .foregroundColor(isSelected ? .white : .primary)
                                
                                if hasWorkouts {
                                    Circle()
                                        .fill(isSelected ? Color.white : Color.fitOrange)
                                        .frame(width: 4, height: 4)
                                } else {
                                    Spacer().frame(height: 4)
                                }
                            }
                            .frame(width: 58, height: 85)
                            .background(isSelected ? Color.fitOrange : Color.white)
                            .cornerRadius(24)
                            .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.black.opacity(isSelected ? 0 : 0.05)))
                            .shadow(color: isSelected ? .fitOrange.opacity(0.3) : Color.clear, radius: 8, y: 4)
                        }
                        .id(date)
                        .scaleEffect(isSelected ? 1.05 : 1.0)
                    }
                }
                .padding(.horizontal)
                .onAppear {
                    // Automatically scroll to today's date on open
                    let calendar = Calendar.current
                    let today = calendar.startOfDay(for: Date())
                    proxy.scrollTo(today, anchor: .center)
                }
            }
        }
    }
    
    func hasWorkoutsOn(_ date: Date) -> Bool {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let ds = formatter.string(from: date)
        return workouts.contains(where: { $0.dateString == ds })
    }
}

struct ScheduledRow: View {
    @Environment(\.modelContext) private var modelContext
    let scheduled: ScheduledWorkout
    let onStart: () -> Void
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(scheduled.template?.name ?? "Untitled Workout")
                    .font(.system(size: 18, weight: .black, design: .rounded))
                Text("\(scheduled.template?.entries.count ?? 0) Exercises")
                    .font(.system(size: 10, weight: .black))
                    .foregroundColor(.fitSecondaryText)
                    .tracking(1)
            }
            Spacer()
            HStack(spacing: 12) {
                Button {
                    modelContext.delete(scheduled)
                } label: {
                    Image(systemName: "trash")
                        .foregroundColor(.fitSecondaryText.opacity(0.5))
                }
                
                Button(action: onStart) {
                    Text("START")
                        .font(.system(size: 12, weight: .black))
                        .foregroundColor(.white)
                        .padding(.horizontal, 20)
                        .padding(.vertical, 10)
                        .background(Color.fitOrange)
                        .cornerRadius(16)
                        .shadow(color: .fitOrange.opacity(0.2), radius: 5, y: 3)
                }
            }
        }
        .padding(20)
        .background(Color.white)
        .cornerRadius(24)
        .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.black.opacity(0.05)))
        .shadow(color: Color.black.opacity(0.02), radius: 10, y: 5)
    }
}

struct AssignWorkoutSheet: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @Query(sort: \WorkoutTemplate.name) private var templates: [WorkoutTemplate]
    let selectedDate: Date
    
    var body: some View {
        NavigationStack {
            List(templates) { template in
                Button {
                    let scheduled = ScheduledWorkout(date: selectedDate, template: template)
                    modelContext.insert(scheduled)
                    dismiss()
                } label: {
                    HStack {
                        VStack(alignment: .leading) {
                            Text(template.name)
                                .font(.headline)
                                .fontWeight(.black)
                            Text("\(template.entries.count) Exercises")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Image(systemName: "plus.circle")
                            .foregroundColor(.fitOrange)
                    }
                }
            }
            .navigationTitle("Assign Workout")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
            }
        }
    }
}

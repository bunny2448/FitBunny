
import SwiftUI
import SwiftData

@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [
            Exercise.self,
            ExerciseEntry.self,
            WorkoutTemplate.self,
            ScheduledWorkout.self,
            WorkoutLog.self
        ])
    }
}

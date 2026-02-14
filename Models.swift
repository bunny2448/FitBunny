
import Foundation
import SwiftData

enum ExerciseType: String, Codable, CaseIterable {
    case setsReps = "Sets & Reps"
    case time = "Time"
    case setsTime = "Sets & Time"
}

@Model
final class Exercise {
    var id: UUID = UUID()
    @Attribute(.unique) var name: String
    var desc: String
    var type: ExerciseType
    var videoFileName: String?
    
    init(name: String, desc: String, type: ExerciseType, videoFileName: String? = nil) {
        self.name = name
        self.desc = desc
        self.type = type
        self.videoFileName = videoFileName
    }
}

@Model
final class ExerciseEntry {
    var exercise: Exercise?
    var exerciseName: String
    var sets: Int
    var reps: Int
    var time: String
    var restTime: Int // Added field
    var isRepeat: Bool
    var isSuperset: Bool
    
    init(exercise: Exercise? = nil, exerciseName: String, sets: Int = 3, reps: Int = 10, time: String = "", restTime: Int = 60, isRepeat: Bool = false, isSuperset: Bool = false) {
        self.exercise = exercise
        self.exerciseName = exerciseName
        self.sets = sets
        self.reps = reps
        self.time = time
        self.restTime = restTime
        self.isRepeat = isRepeat
        self.isSuperset = isSuperset
    }
}

@Model
final class WorkoutTemplate {
    @Attribute(.unique) var id: UUID = UUID()
    var name: String
    @Relationship(deleteRule: .cascade) var entries: [ExerciseEntry]
    
    init(name: String, entries: [ExerciseEntry] = []) {
        self.name = name
        self.entries = entries
    }
}

@Model
final class ScheduledWorkout {
    var id: UUID = UUID()
    var dateString: String // YYYY-MM-DD
    var template: WorkoutTemplate?
    
    init(date: Date, template: WorkoutTemplate? = nil) {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        self.dateString = formatter.string(from: date)
        self.template = template
    }
}

@Model
final class SetLog {
    var weight: Double
    var reps: Int
    var time: String
    
    init(weight: Double, reps: Int, time: String = "") {
        self.weight = weight
        self.reps = reps
        self.time = time
    }
}

@Model
final class ExerciseLog {
    var exerciseName: String
    var exerciseId: String
    @Relationship(deleteRule: .cascade) var sets: [SetLog]
    
    init(exerciseName: String, exerciseId: String, sets: [SetLog] = []) {
        self.exerciseName = exerciseName
        self.exerciseId = exerciseId
        self.sets = sets
    }
}

@Model
final class WorkoutLog {
    var id: UUID = UUID()
    var date: Date
    var workoutName: String
    var rating: String
    var durationSeconds: Int
    @Relationship(deleteRule: .cascade) var exerciseLogs: [ExerciseLog]
    
    init(date: Date, workoutName: String, rating: String, durationSeconds: Int = 0, exerciseLogs: [ExerciseLog] = []) {
        self.date = date
        self.workoutName = workoutName
        self.rating = rating
        self.durationSeconds = durationSeconds
        self.exerciseLogs = exerciseLogs
    }
}

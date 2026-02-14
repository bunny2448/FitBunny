
import SwiftUI
import SwiftData

struct HistoryView: View {
    @Query(sort: \WorkoutLog.date, order: .reverse) private var logs: [WorkoutLog]
    
    private var stats: (week: Int, month: Int, total: Int) {
        let now = Date()
        var calendar = Calendar.current
        calendar.firstWeekday = 7 // Saturday
        
        let components = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: now)
        guard let startOfWeek = calendar.date(from: components) else {
            return (0, 0, logs.count)
        }
        
        let weekLogs = logs.filter { $0.date >= startOfWeek }
        
        let monthLogs = logs.filter { log in
            calendar.isDate(log.date, equalTo: now, toGranularity: .month)
        }
        
        return (weekLogs.count, monthLogs.count, logs.count)
    }
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color.fitBackground.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    BrandingHeader()
                    
                    if logs.isEmpty {
                        VStack(spacing: 20) {
                            Image(systemName: "clock.arrow.circlepath")
                                .font(.system(size: 60))
                                .foregroundColor(.fitSecondaryText.opacity(0.2))
                            Text("Complete a workout to see history.")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundColor(.fitSecondaryText)
                        }
                        .padding(.top, 100)
                    } else {
                        ScrollView {
                            VStack(spacing: 24) {
                                // Stats Summary
                                HStack(spacing: 12) {
                                    StatCard(title: "This Week", value: "\(stats.week)", icon: "calendar", subtext: "(Sat start)")
                                    StatCard(title: "This Month", value: "\(stats.month)", icon: "target")
                                    StatCard(title: "Total", value: "\(stats.total)", icon: "trophy.fill")
                                }
                                .padding(.horizontal)
                                
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("SESSION HISTORY")
                                        .font(.system(size: 11, weight: .black))
                                        .foregroundColor(.fitSecondaryText)
                                        .tracking(2)
                                        .padding(.horizontal)
                                    
                                    LazyVStack(spacing: 12) {
                                        ForEach(logs) { log in
                                            HistoryCard(log: log)
                                        }
                                    }
                                    .padding(.horizontal)
                                }
                            }
                            .padding(.vertical)
                        }
                    }
                }
            }
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    var subtext: String? = nil
    
    var body: some View {
        VStack(spacing: 4) {
            ZStack {
                Circle()
                    .fill(Color.fitOrange.opacity(0.1))
                    .frame(width: 32, height: 32)
                Image(systemName: icon)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.fitOrange)
            }
            .padding(.bottom, 4)
            
            Text(value)
                .font(.system(size: 20, weight: .black, design: .rounded))
                .foregroundColor(.primary)
            
            Text(title.uppercased())
                .font(.system(size: 8, weight: .black))
                .foregroundColor(.fitSecondaryText)
                .tracking(1)
            
            if let sub = subtext {
                Text(sub)
                    .font(.system(size: 7, weight: .bold))
                    .foregroundColor(.fitSecondaryText.opacity(0.6))
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(Color.white)
        .cornerRadius(20)
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.black.opacity(0.05)))
        .shadow(color: Color.black.opacity(0.02), radius: 8, y: 4)
    }
}

struct HistoryCard: View {
    let log: WorkoutLog
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(log.workoutName)
                    .font(.system(size: 18, weight: .black, design: .rounded))
                HStack(spacing: 12) {
                    Text(log.date.formatted(date: .abbreviated, time: .shortened))
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.fitSecondaryText)
                    Text("DURATION: \(log.durationSeconds / 60)m")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.fitSecondaryText)
                }
            }
            Spacer()
            Text(log.rating.uppercased())
                .font(.system(size: 9, weight: .black))
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(ratingColor.opacity(0.1))
                .foregroundColor(ratingColor)
                .clipShape(Capsule())
        }
        .padding(24)
        .background(Color.white)
        .cornerRadius(24)
        .overlay(RoundedRectangle(cornerRadius: 24).stroke(Color.black.opacity(0.05)))
        .shadow(color: Color.black.opacity(0.02), radius: 10, y: 5)
    }
    
    var ratingColor: Color {
        if log.rating.contains("Hard") { return .red }
        if log.rating.contains("Easy") { return .green }
        return .fitOrange
    }
}

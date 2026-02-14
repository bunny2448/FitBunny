import SwiftUI
import SwiftData

struct ContentView: View {
    @State private var selectedTab = 2 // Default to Calendar
    
    init() {
        // Match the TabBar appearance to the web preview
        let appearance = UITabBarAppearance()
        appearance.backgroundColor = UIColor(Color.white)
        appearance.shadowColor = UIColor.black.withAlphaComponent(0.05)
        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            ExercisesView()
                .tabItem {
                    Label("Exercises", systemImage: "dumbbell.fill")
                }
                .tag(0)
            
            WorkoutsView()
                .tabItem {
                    Label("Workouts", systemImage: "list.bullet.indent")
                }
                .tag(1)
            
            CalendarView()
                .tabItem {
                    Label("Calendar", systemImage: "calendar")
                }
                .tag(2)
            
            HistoryView()
                .tabItem {
                    Label("History", systemImage: "clock.fill")
                }
                .tag(3)
        }
        .tint(Color.fitOrange)
    }
}

extension Color {
    static let fitOrange = Color(red: 1.0, green: 0.27, blue: 0.0) // #FF4500
    static let fitBackground = Color(red: 0.98, green: 0.98, blue: 0.98) // #F9F9F9
    static let fitSecondaryText = Color(red: 0.66, green: 0.66, blue: 0.66) // #AAAAAA
}

struct BrandingHeader: View {
    var body: some View {
        HStack(spacing: 8) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.fitOrange)
                    .frame(width: 32, height: 32)
                Image(systemName: "rabbit.fill")
                    .foregroundColor(.white)
                    .font(.system(size: 18))
            }
            Text("FitBunny")
                .font(.system(size: 20, weight: .black, design: .rounded))
                .tracking(-1)
            Spacer()
        }
        .padding(.horizontal)
        .padding(.bottom, 8)
    }
}
import SwiftUI
import SwiftData

struct ContentView: View {
    @Query private var users: [UserProfile]
    
    var body: some View {
        if let user = users.first, user.hasCompletedOnboarding {
            TabView {
                DashboardView()
                    .tabItem {
                        Label("Dashboard", systemImage: "house.fill")
                    }
                
                StatsView()
                    .tabItem {
                        Label("Stats", systemImage: "chart.bar.fill")
                    }
                
                BadgeCollectionView()
                    .tabItem {
                        Label("Badges", systemImage: "medal.fill")
                    }
                
                SettingsView()
                    .tabItem {
                        Label("Settings", systemImage: "gear")
                    }
            }
            .tint(.orange)
        } else {
            OnboardingView()
        }
    }
}

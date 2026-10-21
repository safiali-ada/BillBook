import SwiftUI
import SwiftData

struct DashboardView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var users: [UserProfile]
    @Query(sort: \Drive.startDate, order: .reverse) private var recentDrives: [Drive]
    
    private var userProfile: UserProfile {
        if let user = users.first {
            return user
        }
        let newUser = UserProfile()
        modelContext.insert(newUser)
        return newUser
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    OdometerView(
                        distance: userProfile.prefersKilometers ? userProfile.totalDistanceKm : userProfile.totalDistanceMiles,
                        unit: userProfile.prefersKilometers ? "km" : "mi"
                    )
                    .padding(.top)
                    
                    LevelProgressView(userProfile: userProfile)
                    
                    HStack(spacing: 16) {
                        streakCard
                        earthCard
                    }
                    
                    quickStatsRow
                    
                    recentDrivesSection
                }
                .padding()
            }
            .navigationTitle("Roamed")
            .background(Color(.systemBackground).edgesIgnoringSafeArea(.all))
        }
    }
    
    private var streakCard: some View {
        VStack(spacing: 8) {
            Text("🔥")
                .font(.largeTitle)
            Text("\(userProfile.currentStreakDays) Days")
                .font(.headline)
            Text("Current Streak")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }
    
    private var earthCard: some View {
        VStack(spacing: 8) {
            Text("🌍")
                .font(.largeTitle)
            Text(userProfile.earthEquivalent)
                .font(.headline)
                .multilineTextAlignment(.center)
            Text("Distance")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }
    
    private var quickStatsRow: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Stats")
                .font(.headline)
            
            HStack {
                VStack(alignment: .leading) {
                    Text("\(userProfile.totalDrives)")
                        .font(.title2.bold())
                    Text("Total Drives")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                if userProfile.moodTrackingEnabled {
                    HStack(spacing: 6) {
                        ForEach(DriveMood.allCases) { mood in
                            Circle()
                                .fill(mood.color)
                                .frame(width: 12, height: 12)
                        }
                    }
                }
            }
            .padding()
            .background(Color(.secondarySystemBackground))
            .cornerRadius(16)
        }
    }
    
    private var recentDrivesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Drives")
                .font(.headline)
            
            ForEach(recentDrives.prefix(5)) { drive in
                HStack {
                    VStack(alignment: .leading) {
                        Text(drive.startDate.formatted(date: .abbreviated, time: .shortened))
                            .font(.subheadline)
                        Text(userProfile.prefersKilometers ? String(format: "%.1f km", drive.distanceKm) : String(format: "%.1f mi", drive.distanceMiles))
                            .font(.headline)
                    }
                    Spacer()
                    if let mood = drive.mood {
                        Text(mood.emoji)
                            .font(.title2)
                    }
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .cornerRadius(12)
            }
        }
    }
}

import SwiftUI
import SwiftData
import Charts

enum StatsPeriod: String, CaseIterable, Identifiable {
    case week = "Week"
    case month = "Month"
    case year = "Year"
    case allTime = "All Time"
    var id: String { rawValue }
}

struct StatsView: View {
    @Query(sort: \Drive.startDate, order: .forward) private var allDrives: [Drive]
    @State private var selectedPeriod: StatsPeriod = .week
    @Query private var users: [UserProfile]
    
    var userProfile: UserProfile? { users.first }
    
    var filteredDrives: [Drive] {
        let now = Date()
        return allDrives.filter { drive in
            switch selectedPeriod {
            case .week:
                return now.timeIntervalSince(drive.startDate) <= 7 * 24 * 3600
            case .month:
                return now.timeIntervalSince(drive.startDate) <= 30 * 24 * 3600
            case .year:
                return now.timeIntervalSince(drive.startDate) <= 365 * 24 * 3600
            case .allTime:
                return true
            }
        }
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    Picker("Period", selection: $selectedPeriod) {
                        ForEach(StatsPeriod.allCases) { period in
                            Text(period.rawValue).tag(period)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal)
                    
                    chartSection
                    statsGrid
                    moodSection
                    
                    HeatmapView(drives: allDrives)
                }
                .padding(.vertical)
            }
            .navigationTitle("Stats")
        }
    }
    
    private var chartSection: some View {
        VStack(alignment: .leading) {
            Text("Distance")
                .font(.headline)
            
            Chart {
                ForEach(filteredDrives) { drive in
                    BarMark(
                        x: .value("Date", drive.startDate, unit: selectedPeriod == .year ? .month : .day),
                        y: .value("Distance", userProfile?.prefersKilometers == true ? drive.distanceKm : drive.distanceMiles)
                    )
                    .foregroundStyle(Color.orange.gradient)
                }
            }
            .frame(height: 200)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
        .padding(.horizontal)
    }
    
    private var statsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
            StatBox(title: "Total Drives", value: "\(filteredDrives.count)")
            StatBox(title: "Total Distance", value: String(format: "%.0f %@", filteredDrives.reduce(0) { $0 + (userProfile?.prefersKilometers == true ? $1.distanceKm : $1.distanceMiles) }, userProfile?.prefersKilometers == true ? "km" : "mi"))
            StatBox(title: "Longest Trip", value: String(format: "%.0f %@", (filteredDrives.map { userProfile?.prefersKilometers == true ? $0.distanceKm : $0.distanceMiles }.max() ?? 0), userProfile?.prefersKilometers == true ? "km" : "mi"))
            StatBox(title: "Safe Drives", value: "\(filteredDrives.filter { !$0.hadPhoneInteraction }.count)")
        }
        .padding(.horizontal)
    }
    
    private var moodSection: some View {
        VStack(alignment: .leading) {
            Text("Mood Breakdown")
                .font(.headline)
            
            let moodCounts = Dictionary(grouping: filteredDrives.compactMap { $0.mood }) { $0 }.mapValues { $0.count }
            let totalMoods = moodCounts.values.reduce(0, +)
            
            if totalMoods > 0 {
                HStack(spacing: 0) {
                    ForEach(DriveMood.allCases) { mood in
                        if let count = moodCounts[mood] {
                            Rectangle()
                                .fill(mood.color)
                                .frame(width: UIScreen.main.bounds.width * 0.8 * CGFloat(count) / CGFloat(totalMoods), height: 20)
                        }
                    }
                }
                .clipShape(Capsule())
                
                HStack {
                    ForEach(DriveMood.allCases) { mood in
                        if let count = moodCounts[mood] {
                            HStack(spacing: 4) {
                                Text(mood.emoji)
                                Text("\(count)")
                                    .font(.caption)
                            }
                            Spacer()
                        }
                    }
                }
                .padding(.top, 8)
            } else {
                Text("No mood data yet.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
        .padding(.horizontal)
    }
}

struct StatBox: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3.bold())
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

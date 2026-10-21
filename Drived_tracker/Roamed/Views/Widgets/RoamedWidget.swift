import WidgetKit
import SwiftUI
import SwiftData

struct RoamedProvider: TimelineProvider {
    // Note: To share SwiftData between the main app and widget,
    // you need to set up an App Group capability (e.g. group.com.roamed.app)
    // and initialize your ModelContainer with that shared URL.
    // For this example, we'll try to fetch from the default container.
    
    @MainActor
    func placeholder(in context: Context) -> RoamedEntry {
        RoamedEntry(date: Date(), distance: 12450.0, streak: 14, isKm: true)
    }

    @MainActor
    func getSnapshot(in context: Context, completion: @escaping (RoamedEntry) -> ()) {
        let entry = fetchLatestData()
        completion(entry)
    }

    @MainActor
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let entry = fetchLatestData()
        
        // Refresh widget every few hours or when app tells it to
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 2, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    @MainActor
    private func fetchLatestData() -> RoamedEntry {
        do {
            let container = try ModelContainer(for: UserProfile.self, Drive.self, Badge.self)
            let context = ModelContext(container)
            if let profile = try? context.fetch(FetchDescriptor<UserProfile>()).first {
                let dist = profile.prefersKilometers ? profile.totalDistanceKm : profile.totalDistanceMiles
                return RoamedEntry(date: Date(), distance: dist, streak: profile.currentStreakDays, isKm: profile.prefersKilometers)
            }
        } catch {
            print("Widget failed to load SwiftData: \(error)")
        }
        return RoamedEntry(date: Date(), distance: 0, streak: 0, isKm: true)
    }
}

struct RoamedEntry: TimelineEntry {
    let date: Date
    let distance: Double
    let streak: Int
    let isKm: Bool
}

struct RoamedWidgetEntryView : View {
    var entry: RoamedProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "flame.fill")
                        .foregroundStyle(.orange)
                    Text("\(entry.streak)")
                        .font(.headline)
                        .bold()
                }
                Spacer()
                Text(String(format: "%.0f", entry.distance))
                    .font(.title2.bold())
                    .minimumScaleFactor(0.8)
                Text(entry.isKm ? "km" : "mi")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
            
        case .accessoryCircular:
            ZStack {
                AccessoryWidgetBackground()
                VStack {
                    Image(systemName: "flame.fill")
                        .font(.caption)
                    Text("\(entry.streak)")
                        .font(.headline)
                }
            }
            
        default:
            VStack(alignment: .leading) {
                Text("Roamed")
                    .font(.headline)
                HStack(spacing: 20) {
                    VStack(alignment: .leading) {
                        Text("Distance")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Text(String(format: "%.0f %@", entry.distance, entry.isKm ? "km" : "mi"))
                            .font(.title.bold())
                    }
                    VStack(alignment: .leading) {
                        Text("Streak")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        HStack {
                            Image(systemName: "flame.fill")
                                .foregroundStyle(.orange)
                            Text("\(entry.streak)")
                                .font(.title.bold())
                        }
                    }
                }
            }
            .padding()
        }
    }
}

@main
struct RoamedWidget: Widget {
    let kind: String = "RoamedWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: RoamedProvider()) { entry in
            if #available(iOS 17.0, *) {
                RoamedWidgetEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                RoamedWidgetEntryView(entry: entry)
                    .padding()
                    .background()
            }
        }
        .configurationDisplayName("Roamed Stats")
        .description("Keep track of your lifetime driving distance and streak.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular])
    }
}

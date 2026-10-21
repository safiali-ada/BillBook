import WidgetKit
import SwiftUI
import SwiftData

struct RoamedProvider: TimelineProvider {
    
    func placeholder(in context: Context) -> RoamedEntry {
        RoamedEntry(date: Date(), distance: 12450.0, streak: 14, isKm: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (RoamedEntry) -> ()) {
        let entry = fetchLatestData()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let entry = fetchLatestData()
        
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 2, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
    
    private func fetchLatestData() -> RoamedEntry {
        do {
            let schema = Schema([Drive.self, UserProfile.self, Badge.self])
            let groupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.roamed.app")!
            let storeURL = groupURL.appendingPathComponent("Roamed.sqlite")
            let modelConfiguration = ModelConfiguration(schema: schema, url: storeURL)
            
            let container = try ModelContainer(for: schema, configurations: [modelConfiguration])
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

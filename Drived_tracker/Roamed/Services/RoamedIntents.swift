import AppIntents
import SwiftData
import SwiftUI

struct RoamedShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: HowFarRoamedIntent(),
            phrases: [
                "How far have I \(.applicationName)?",
                "What is my driving distance in \(.applicationName)?",
                "Check my distance on \(.applicationName)"
            ],
            shortTitle: "Check Driving Distance",
            systemImageName: "road.lanes"
        )
        
        AppShortcut(
            intent: DrivingLevelIntent(),
            phrases: [
                "What is my \(.applicationName) level?",
                "Check my driving level in \(.applicationName)"
            ],
            shortTitle: "Check Driving Level",
            systemImageName: "star.circle.fill"
        )
        
        AppShortcut(
            intent: StreakIntent(),
            phrases: [
                "What is my \(.applicationName) streak?",
                "Check my driving streak in \(.applicationName)"
            ],
            shortTitle: "Check Driving Streak",
            systemImageName: "flame.fill"
        )
    }
}

struct HowFarRoamedIntent: AppIntent {
    static let title: LocalizedStringResource = "Check Driving Distance"
    static let description = IntentDescription("Tells you how far you have driven in total.")
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        // App Intents run in a background context, we need to fetch SwiftData manually.
        // We'll use a temporary ModelContainer to fetch the profile.
        let schema = Schema([Drive.self, UserProfile.self, Badge.self])
        let groupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.roamed.app")!
        let storeURL = groupURL.appendingPathComponent("Roamed.sqlite")
        let modelConfiguration = ModelConfiguration(schema: schema, url: storeURL)
        let container = try ModelContainer(for: schema, configurations: [modelConfiguration])
        let context = ModelContext(container)
        
        let descriptor = FetchDescriptor<UserProfile>()
        guard let profile = try? context.fetch(descriptor).first else {
            return .result(dialog: "You haven't tracked any drives in Roamed yet.")
        }
        
        let distance = profile.formattedTotalDistance
        let level = profile.currentLevel.title
        
        return .result(dialog: "You've driven \(distance) in total. You are currently a \(level).")
    }
}

struct DrivingLevelIntent: AppIntent {
    static let title: LocalizedStringResource = "Check Driving Level"
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let schema = Schema([Drive.self, UserProfile.self, Badge.self])
        let groupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.roamed.app")!
        let storeURL = groupURL.appendingPathComponent("Roamed.sqlite")
        let modelConfiguration = ModelConfiguration(schema: schema, url: storeURL)
        let container = try ModelContainer(for: schema, configurations: [modelConfiguration])
        let context = ModelContext(container)
        
        guard let profile = try? context.fetch(FetchDescriptor<UserProfile>()).first else {
            return .result(dialog: "You haven't started your Roamed journey yet.")
        }
        
        let level = profile.currentLevel.title
        let nextLevelStr: String
        if let nextLevel = profile.nextLevel {
            if profile.prefersKilometers {
                let remaining = (nextLevel.requiredDistanceMeters - profile.totalDistanceMeters) / 1000
                nextLevelStr = String(format: "You need %.0f more kilometers to reach %@", remaining, nextLevel.title)
            } else {
                let remaining = (nextLevel.requiredDistanceMeters - profile.totalDistanceMeters) / 1609.344
                nextLevelStr = String(format: "You need %.0f more miles to reach %@", remaining, nextLevel.title)
            }
        } else {
            nextLevelStr = "You've reached the highest level, Globe Trotter!"
        }
        
        return .result(dialog: "Your current level is \(level). \(nextLevelStr)")
    }
}

struct StreakIntent: AppIntent {
    static let title: LocalizedStringResource = "Check Driving Streak"
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let container = try ModelContainer(for: UserProfile.self, Drive.self, Badge.self)
        let context = ModelContext(container)
        
        guard let profile = try? context.fetch(FetchDescriptor<UserProfile>()).first else {
            return .result(dialog: "You don't have a driving streak yet.")
        }
        
        let streak = profile.currentStreakDays
        if streak == 0 {
            return .result(dialog: "You don't have an active driving streak right now. Go for a drive to start one!")
        } else {
            return .result(dialog: "Your current driving streak is \(streak) days. Keep it up!")
        }
    }
}

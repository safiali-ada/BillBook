import Foundation
import SwiftData

/// Singleton user profile that tracks lifetime driving stats.
/// There should only ever be one instance of this model in the store.
@Model
final class UserProfile {
    /// Total lifetime distance in meters (sum of all drives where wasDriver == true).
    var totalDistanceMeters: Double

    /// Total number of completed drives.
    var totalDrives: Int

    /// Current consecutive driving streak in days.
    var currentStreakDays: Int

    /// Longest ever streak in days.
    var longestStreakDays: Int

    /// Date of the most recent drive.
    var lastDriveDate: Date?

    /// Whether a streak freeze is available this week.
    var streakFreezeAvailable: Bool

    /// Date when the last streak freeze was used.
    var lastStreakFreezeDate: Date?

    /// Total number of safe drives (no phone interaction).
    var totalSafeDrives: Int

    /// Whether the user prefers kilometers (true) or miles (false).
    var prefersKilometers: Bool

    /// Whether mood tracking is enabled.
    var moodTrackingEnabled: Bool

    /// Whether HealthKit integration is enabled.
    var healthKitEnabled: Bool

    /// Whether iCloud sync is enabled.
    var iCloudSyncEnabled: Bool

    /// Whether onboarding has been completed.
    var hasCompletedOnboarding: Bool

    // MARK: - Computed Properties

    /// Total distance in kilometers.
    var totalDistanceKm: Double {
        totalDistanceMeters / 1_000
    }

    /// Total distance in miles.
    var totalDistanceMiles: Double {
        totalDistanceMeters / 1_609.344
    }

    /// Current level based on total distance.
    var currentLevel: Level {
        Level.current(for: totalDistanceMeters)
    }

    /// Progress toward the next level (0.0–1.0).
    var levelProgress: Double {
        Level.progress(for: totalDistanceMeters)
    }

    /// The next level, or `nil` if at Globe Trotter.
    var nextLevel: Level? {
        Level.next(after: currentLevel)
    }

    /// Prestige multiplier if past Globe Trotter, or `nil`.
    var prestigeMultiplier: Int? {
        Level.prestigeMultiplier(for: totalDistanceMeters)
    }

    /// Earth equivalent string (e.g., "1.3× around the Earth").
    var earthEquivalent: String {
        Level.earthEquivalent(for: totalDistanceMeters)
    }

    /// Formatted total distance using the user's preferred unit.
    var formattedTotalDistance: String {
        if prefersKilometers {
            String(format: "%.0f km", totalDistanceKm)
        } else {
            String(format: "%.0f mi", totalDistanceMiles)
        }
    }

    /// Distance remaining to the next level, in the user's preferred unit.
    var distanceToNextLevel: String? {
        guard let next = nextLevel else { return nil }
        let remaining = next.requiredDistanceMeters - totalDistanceMeters
        if prefersKilometers {
            return String(format: "%.0f km to %@", remaining / 1_000, next.title)
        } else {
            return String(format: "%.0f mi to %@", remaining / 1_609.344, next.title)
        }
    }

    // MARK: - Init

    init() {
        self.totalDistanceMeters = 0
        self.totalDrives = 0
        self.currentStreakDays = 0
        self.longestStreakDays = 0
        self.lastDriveDate = nil
        self.streakFreezeAvailable = true
        self.lastStreakFreezeDate = nil
        self.totalSafeDrives = 0
        self.prefersKilometers = true
        self.moodTrackingEnabled = true
        self.healthKitEnabled = false
        self.iCloudSyncEnabled = false
        self.hasCompletedOnboarding = false
    }
}

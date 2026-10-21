import Foundation
import SwiftData

/// A single completed drive session.
@Model
final class Drive {
    /// Unique identifier.
    var id: UUID

    /// When the drive started.
    var startDate: Date

    /// When the drive ended.
    var endDate: Date

    /// Total distance in meters.
    var distanceMeters: Double

    /// Optional mood tag set after the drive.
    var moodRawValue: String?

    /// Whether the user was the driver (true) or a passenger (false).
    var wasDriver: Bool

    /// Whether the user interacted with the phone during this drive.
    /// `false` = safe drive (no phone interaction).
    var hadPhoneInteraction: Bool

    // MARK: - Computed Properties

    /// Drive duration.
    var duration: TimeInterval {
        endDate.timeIntervalSince(startDate)
    }

    /// Distance in kilometers.
    var distanceKm: Double {
        distanceMeters / 1_000
    }

    /// Distance in miles.
    var distanceMiles: Double {
        distanceMeters / 1_609.344
    }

    /// The mood, if set.
    var mood: DriveMood? {
        get {
            guard let raw = moodRawValue else { return nil }
            return DriveMood(rawValue: raw)
        }
        set {
            moodRawValue = newValue?.rawValue
        }
    }

    /// Hour of the day when the drive started (0–23).
    var startHour: Int {
        Calendar.current.component(.hour, from: startDate)
    }

    /// Whether this drive started after midnight and before 5 AM.
    var isNightDrive: Bool {
        startHour >= 0 && startHour < 5
    }

    /// Whether this drive started before 6 AM.
    var isEarlyMorningDrive: Bool {
        startHour < 6
    }

    /// Whether this drive occurred on a weekend.
    var isWeekendDrive: Bool {
        Calendar.current.isDateInWeekend(startDate)
    }

    // MARK: - Init

    init(
        startDate: Date,
        endDate: Date,
        distanceMeters: Double,
        wasDriver: Bool = true,
        hadPhoneInteraction: Bool = false,
        mood: DriveMood? = nil
    ) {
        self.id = UUID()
        self.startDate = startDate
        self.endDate = endDate
        self.distanceMeters = distanceMeters
        self.wasDriver = wasDriver
        self.hadPhoneInteraction = hadPhoneInteraction
        self.moodRawValue = mood?.rawValue
    }
}

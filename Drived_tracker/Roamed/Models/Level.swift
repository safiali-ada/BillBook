import Foundation

/// A driving level in the Roamed progression system.
/// 12 levels from First Gear (0 km) to Globe Trotter (40,075 km).
/// After Globe Trotter, prestige multipliers track "×N around the Earth."
struct Level: Identifiable, Equatable {
    let id: Int // level number, 1–12
    let title: String
    let requiredDistanceMeters: Double
    let funComparison: String

    /// Required distance in kilometers for display.
    var requiredDistanceKm: Double {
        requiredDistanceMeters / 1_000
    }
}

// MARK: - All Levels

extension Level {
    /// The complete level progression table.
    static let all: [Level] = [
        Level(id: 1,  title: "First Gear",         requiredDistanceMeters: 0,            funComparison: "Every journey starts here"),
        Level(id: 2,  title: "Block Runner",        requiredDistanceMeters: 50_000,       funComparison: "Your neighborhood, mapped"),
        Level(id: 3,  title: "City Starter",         requiredDistanceMeters: 200_000,      funComparison: "Delhi metro end to end"),
        Level(id: 4,  title: "Town Explorer",        requiredDistanceMeters: 500_000,      funComparison: "Dubai ↔ Abu Dhabi round trip"),
        Level(id: 5,  title: "Weekend Warrior",      requiredDistanceMeters: 1_000_000,    funComparison: "Mumbai ↔ Goa round trip"),
        Level(id: 6,  title: "Open Roader",          requiredDistanceMeters: 2_000_000,    funComparison: "Length of Japan"),
        Level(id: 7,  title: "Highway Regular",      requiredDistanceMeters: 2_500_000,    funComparison: "Cairo ↔ Cape Town straight line"),
        Level(id: 8,  title: "Road Tripper",         requiredDistanceMeters: 5_000_000,    funComparison: "Delhi ↔ Kanyakumari round trip"),
        Level(id: 9,  title: "Mile Muncher",         requiredDistanceMeters: 10_000_000,   funComparison: "Moscow ↔ Vladivostok"),
        Level(id: 10, title: "Cross-Country Pro",    requiredDistanceMeters: 15_000_000,   funComparison: "One full year of average driving"),
        Level(id: 11, title: "Continental Cruiser",   requiredDistanceMeters: 25_000_000,   funComparison: "Australia's coastline"),
        Level(id: 12, title: "Globe Trotter",        requiredDistanceMeters: 40_075_000,   funComparison: "Around the Earth 🌍"),
    ]

    /// Maximum level (Globe Trotter).
    static let max = all.last!

    /// Earth's circumference in meters — the yardstick for prestige.
    static let earthCircumferenceMeters: Double = 40_075_000

    // MARK: - Lookup Helpers

    /// Returns the current level for a given total distance in meters.
    static func current(for distanceMeters: Double) -> Level {
        all.last(where: { distanceMeters >= $0.requiredDistanceMeters }) ?? all[0]
    }

    /// Returns the next level, or `nil` if already at Globe Trotter.
    static func next(after level: Level) -> Level? {
        guard level.id < max.id else { return nil }
        return all.first(where: { $0.id == level.id + 1 })
    }

    /// Progress toward the next level as a fraction (0.0–1.0).
    /// Returns 1.0 if already at Globe Trotter.
    static func progress(for distanceMeters: Double) -> Double {
        let current = current(for: distanceMeters)
        guard let next = next(after: current) else { return 1.0 }
        let range = next.requiredDistanceMeters - current.requiredDistanceMeters
        let progress = distanceMeters - current.requiredDistanceMeters
        return Swift.min(Swift.max(progress / range, 0), 1)
    }

    /// Prestige multiplier for post-Globe Trotter distances.
    /// Returns `nil` if below Globe Trotter threshold.
    /// Example: 80,150 km → "×2", 120,225 km → "×3"
    static func prestigeMultiplier(for distanceMeters: Double) -> Int? {
        guard distanceMeters >= earthCircumferenceMeters else { return nil }
        return Int(distanceMeters / earthCircumferenceMeters)
    }

    /// Human-readable Earth equivalent string.
    /// Examples: "0.5× around the Earth", "2.3× around the Earth"
    static func earthEquivalent(for distanceMeters: Double) -> String {
        let multiplier = distanceMeters / earthCircumferenceMeters
        if multiplier < 0.01 {
            return "Just getting started"
        } else if multiplier < 1.0 {
            return String(format: "%.1f%% around the Earth", multiplier * 100)
        } else {
            return String(format: "%.1f× around the Earth", multiplier)
        }
    }
}

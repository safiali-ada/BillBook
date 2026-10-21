import Foundation

/// Categories for organizing badges in the collection view.
enum BadgeCategory: String, Codable, CaseIterable, Identifiable {
    case milestone
    case time
    case distance
    case consistency
    case mood

    var id: String { rawValue }

    var label: String {
        switch self {
        case .milestone:   "Milestones"
        case .time:        "Time"
        case .distance:    "Distance"
        case .consistency: "Consistency"
        case .mood:        "Mood"
        }
    }

    var icon: String {
        switch self {
        case .milestone:   "flag.checkered"
        case .time:        "clock"
        case .distance:    "road.lanes"
        case .consistency: "flame"
        case .mood:        "heart"
        }
    }
}

/// Every badge available in Roamed.
/// Badge art uses the rally-sticker aesthetic — each `iconName` maps to a custom asset.
enum BadgeType: String, Codable, CaseIterable, Identifiable {

    // MARK: - Milestones
    case firstDrive
    case tenDrives
    case fiftyDrives
    case hundredDrives
    case fiveHundredDrives

    // MARK: - Time-Based
    case nightOwl
    case earlyBird
    case summerCruiser
    case monsoonWarrior
    case weekendExplorer

    // MARK: - Distance Feats
    case firstThousand
    case fiveThousand
    case tenThousand
    case roadTripper       // single trip > 200 km
    case marathonDrive     // single trip > 500 km
    case globeTrotter      // lifetime 40,075 km

    // MARK: - Consistency
    case weekStreak
    case monthStreak
    case quarterStreak     // 90 days
    case safeDriver10      // 10 drives, zero phone interaction
    case safeDriver50      // 50 drives

    // MARK: - Mood
    case zenDriver         // 10 drives tagged relaxing
    case joyRider          // 10 drives tagged fun
    case focusMaster       // 10 drives tagged focused
    case moodExplorer      // used all 4 moods

    var id: String { rawValue }

    var category: BadgeCategory {
        switch self {
        case .firstDrive, .tenDrives, .fiftyDrives, .hundredDrives, .fiveHundredDrives:
            .milestone
        case .nightOwl, .earlyBird, .summerCruiser, .monsoonWarrior, .weekendExplorer:
            .time
        case .firstThousand, .fiveThousand, .tenThousand, .roadTripper, .marathonDrive, .globeTrotter:
            .distance
        case .weekStreak, .monthStreak, .quarterStreak, .safeDriver10, .safeDriver50:
            .consistency
        case .zenDriver, .joyRider, .focusMaster, .moodExplorer:
            .mood
        }
    }

    var title: String {
        switch self {
        // Milestones
        case .firstDrive:       "First Gear"
        case .tenDrives:        "Getting Rolling"
        case .fiftyDrives:      "Regular Roller"
        case .hundredDrives:    "Century Driver"
        case .fiveHundredDrives: "Road Veteran"

        // Time
        case .nightOwl:         "Night Owl"
        case .earlyBird:        "Early Bird"
        case .summerCruiser:    "Summer Cruiser"
        case .monsoonWarrior:   "Monsoon Warrior"
        case .weekendExplorer:  "Weekend Explorer"

        // Distance
        case .firstThousand:    "1K Club"
        case .fiveThousand:     "5K Club"
        case .tenThousand:      "10K Club"
        case .roadTripper:      "Road Tripper"
        case .marathonDrive:    "Marathon Drive"
        case .globeTrotter:     "Globe Trotter"

        // Consistency
        case .weekStreak:       "Week Warrior"
        case .monthStreak:      "Month Machine"
        case .quarterStreak:    "Quarter King"
        case .safeDriver10:     "Safe Starter"
        case .safeDriver50:     "Safety First"

        // Mood
        case .zenDriver:        "Zen Driver"
        case .joyRider:         "Joy Rider"
        case .focusMaster:      "Focus Master"
        case .moodExplorer:     "Mood Explorer"
        }
    }

    var description: String {
        switch self {
        case .firstDrive:       "Complete your first drive"
        case .tenDrives:        "Complete 10 drives"
        case .fiftyDrives:      "Complete 50 drives"
        case .hundredDrives:    "Complete 100 drives"
        case .fiveHundredDrives: "Complete 500 drives"

        case .nightOwl:         "Drive after midnight"
        case .earlyBird:        "Drive before 6 AM"
        case .summerCruiser:    "Drive on 10 days in summer"
        case .monsoonWarrior:   "Drive on 10 days during monsoon season"
        case .weekendExplorer:  "Drive on 20 weekends"

        case .firstThousand:    "Reach 1,000 km lifetime"
        case .fiveThousand:     "Reach 5,000 km lifetime"
        case .tenThousand:      "Reach 10,000 km lifetime"
        case .roadTripper:      "Complete a single trip over 200 km"
        case .marathonDrive:    "Complete a single trip over 500 km"
        case .globeTrotter:     "Drive 40,075 km — around the Earth 🌍"

        case .weekStreak:       "Drive 7 days in a row"
        case .monthStreak:      "Drive 30 days in a row"
        case .quarterStreak:    "Drive 90 days in a row"
        case .safeDriver10:     "Complete 10 safe drives (no phone interaction)"
        case .safeDriver50:     "Complete 50 safe drives"

        case .zenDriver:        "Tag 10 drives as Relaxing 😌"
        case .joyRider:         "Tag 10 drives as Fun 🎉"
        case .focusMaster:      "Tag 10 drives as Focused 🎯"
        case .moodExplorer:     "Use all 4 mood tags at least once"
        }
    }

    /// SF Symbol name used as a placeholder until custom rally-sticker art is ready.
    var systemIconName: String {
        switch self {
        case .firstDrive:       "car"
        case .tenDrives:        "10.circle.fill"
        case .fiftyDrives:      "50.circle.fill"
        case .hundredDrives:    "star.circle.fill"
        case .fiveHundredDrives: "crown.fill"

        case .nightOwl:         "moon.stars.fill"
        case .earlyBird:        "sunrise.fill"
        case .summerCruiser:    "sun.max.fill"
        case .monsoonWarrior:   "cloud.rain.fill"
        case .weekendExplorer:  "calendar.badge.checkmark"

        case .firstThousand:    "gauge.with.dots.needle.33percent"
        case .fiveThousand:     "gauge.with.dots.needle.50percent"
        case .tenThousand:      "gauge.with.dots.needle.67percent"
        case .roadTripper:      "road.lanes"
        case .marathonDrive:    "figure.run"
        case .globeTrotter:     "globe"

        case .weekStreak:       "flame"
        case .monthStreak:      "flame.fill"
        case .quarterStreak:    "flame.circle.fill"
        case .safeDriver10:     "iphone.slash"
        case .safeDriver50:     "shield.checkered"

        case .zenDriver:        "leaf.fill"
        case .joyRider:         "party.popper.fill"
        case .focusMaster:      "scope"
        case .moodExplorer:     "heart.text.clipboard"
        }
    }

    /// Whether this badge is available in the free tier.
    var isFree: Bool {
        switch self {
        case .firstDrive, .tenDrives, .firstThousand, .weekStreak, .nightOwl:
            true
        default:
            false
        }
    }
}

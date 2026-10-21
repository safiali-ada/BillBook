import Foundation
import SwiftData

/// A badge earned by the user.
@Model
final class Badge {
    /// Unique identifier.
    var id: UUID

    /// The type of badge (maps to the BadgeType enum).
    var badgeTypeRawValue: String

    /// When the badge was earned.
    var earnedDate: Date

    /// Whether the user has seen this badge yet (for "New" indicator).
    var isNew: Bool

    // MARK: - Computed

    /// The badge type enum value.
    var badgeType: BadgeType? {
        BadgeType(rawValue: badgeTypeRawValue)
    }

    // MARK: - Init

    init(badgeType: BadgeType) {
        self.id = UUID()
        self.badgeTypeRawValue = badgeType.rawValue
        self.earnedDate = Date()
        self.isNew = true
    }
}

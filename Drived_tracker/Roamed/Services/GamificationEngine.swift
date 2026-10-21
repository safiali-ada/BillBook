import Foundation
import SwiftData

struct DriveResult {
    let drive: Drive
    let levelChanged: Bool
    let newBadges: [BadgeType]
    let currentStreakDays: Int
}

struct GamificationEngine {
    
    @MainActor
    static func processDrive(_ drive: Drive, context: ModelContext) -> DriveResult {
        // Fetch or create user profile
        let profile = fetchOrCreateProfile(context: context)
        
        let oldLevel = profile.currentLevel
        
        // Update basic stats
        profile.totalDistanceMeters += drive.distanceMeters
        profile.totalDrives += 1
        if !drive.hadPhoneInteraction {
            profile.totalSafeDrives += 1
        }
        
        // Update streak
        StreakService.updateStreak(profile: profile, driveDate: drive.startDate)
        
        // Check level up
        let newLevel = profile.currentLevel
        let levelChanged = (oldLevel.id != newLevel.id)
        
        // Fetch all drives for badge evaluation
        let fetchDescriptor = FetchDescriptor<Drive>(sortBy: [SortDescriptor(\.startDate)])
        let allDrives = (try? context.fetch(fetchDescriptor)) ?? []
        
        let badgeFetch = FetchDescriptor<Badge>()
        let earnedBadges = (try? context.fetch(badgeFetch)) ?? []
        
        // Evaluate badges
        let newBadgeTypes = BadgeService.evaluateNewBadges(
            drive: drive,
            allDrives: allDrives,
            profile: profile,
            earnedBadges: earnedBadges
        )
        
        for badgeType in newBadgeTypes {
            let badge = Badge(badgeType: badgeType)
            context.insert(badge)
        }
        
        profile.lastDriveDate = drive.startDate
        
        // Save context
        do {
            try context.save()
        } catch {
            print("Failed to save Gamification results: \(error)")
        }
        
        return DriveResult(
            drive: drive,
            levelChanged: levelChanged,
            newBadges: newBadgeTypes,
            currentStreakDays: profile.currentStreakDays
        )
    }
    
    @MainActor
    private static func fetchOrCreateProfile(context: ModelContext) -> UserProfile {
        let descriptor = FetchDescriptor<UserProfile>()
        if let profile = try? context.fetch(descriptor).first {
            return profile
        } else {
            let newProfile = UserProfile()
            context.insert(newProfile)
            return newProfile
        }
    }
}

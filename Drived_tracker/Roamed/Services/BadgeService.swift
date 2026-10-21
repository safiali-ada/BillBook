import Foundation

struct BadgeService {
    
    static func evaluateNewBadges(
        drive: Drive,
        allDrives: [Drive],
        profile: UserProfile,
        earnedBadges: [Badge]
    ) -> [BadgeType] {
        
        var newBadges: [BadgeType] = []
        let earnedTypes = Set(earnedBadges.compactMap { $0.badgeType })
        
        func award(_ badge: BadgeType) {
            if !earnedTypes.contains(badge) && !newBadges.contains(badge) {
                newBadges.append(badge)
            }
        }
        
        // MARK: - Milestones
        if profile.totalDrives >= 1 { award(.firstDrive) }
        if profile.totalDrives >= 10 { award(.tenDrives) }
        if profile.totalDrives >= 50 { award(.fiftyDrives) }
        if profile.totalDrives >= 100 { award(.hundredDrives) }
        if profile.totalDrives >= 500 { award(.fiveHundredDrives) }
        
        // MARK: - Time-Based
        if drive.isNightDrive { award(.nightOwl) }
        if drive.isEarlyMorningDrive { award(.earlyBird) }
        
        let summerDrives = allDrives.filter { Calendar.current.component(.month, from: $0.startDate) >= 6 && Calendar.current.component(.month, from: $0.startDate) <= 8 }
        if summerDrives.count >= 10 { award(.summerCruiser) }
        
        let monsoonDrives = allDrives.filter { Calendar.current.component(.month, from: $0.startDate) >= 7 && Calendar.current.component(.month, from: $0.startDate) <= 9 }
        if monsoonDrives.count >= 10 { award(.monsoonWarrior) }
        
        let weekendDrives = allDrives.filter { $0.isWeekendDrive }
        if weekendDrives.count >= 20 { award(.weekendExplorer) }
        
        // MARK: - Distance Feats
        let lifetimeKm = profile.totalDistanceKm
        if lifetimeKm >= 1_000 { award(.firstThousand) }
        if lifetimeKm >= 5_000 { award(.fiveThousand) }
        if lifetimeKm >= 10_000 { award(.tenThousand) }
        
        if drive.distanceKm >= 200 { award(.roadTripper) }
        if drive.distanceKm >= 500 { award(.marathonDrive) }
        
        if profile.totalDistanceMeters >= Level.earthCircumferenceMeters { award(.globeTrotter) }
        
        // MARK: - Consistency
        if profile.currentStreakDays >= 7 { award(.weekStreak) }
        if profile.currentStreakDays >= 30 { award(.monthStreak) }
        if profile.currentStreakDays >= 90 { award(.quarterStreak) }
        
        if profile.totalSafeDrives >= 10 { award(.safeDriver10) }
        if profile.totalSafeDrives >= 50 { award(.safeDriver50) }
        
        // MARK: - Mood
        let relaxingCount = allDrives.filter { $0.mood == .relaxing }.count
        if relaxingCount >= 10 { award(.zenDriver) }
        
        let funCount = allDrives.filter { $0.mood == .fun }.count
        if funCount >= 10 { award(.joyRider) }
        
        let focusedCount = allDrives.filter { $0.mood == .focused }.count
        if focusedCount >= 10 { award(.focusMaster) }
        
        let usedMoods = Set(allDrives.compactMap { $0.mood })
        if usedMoods.count >= 4 { award(.moodExplorer) }
        
        return newBadges
    }
}

import Foundation

struct LevelService {
    
    enum Region {
        case global
        case india
        case middleEast
    }
    
    static func distanceComparison(for distanceMeters: Double, region: Region = .global) -> String {
        let distanceKm = distanceMeters / 1_000
        
        switch region {
        case .india:
            if distanceKm < 50 {
                return "Gurgaon to Delhi"
            } else if distanceKm < 200 {
                return "Mumbai to Pune"
            } else if distanceKm < 500 {
                return "Delhi to Jaipur"
            } else if distanceKm < 1500 {
                return "Delhi to Mumbai"
            } else if distanceKm < 3000 {
                return "Kashmir to Kanyakumari"
            } else {
                return Level.earthEquivalent(for: distanceMeters)
            }
            
        case .middleEast:
            if distanceKm < 150 {
                return "Dubai to Abu Dhabi"
            } else if distanceKm < 400 {
                return "Dubai to Muscat"
            } else if distanceKm < 1000 {
                return "Riyadh to Jeddah"
            } else {
                return Level.earthEquivalent(for: distanceMeters)
            }
            
        case .global:
            if distanceKm < 10 {
                return "Across the Golden Gate Bridge"
            } else if distanceKm < 50 {
                return "A full marathon"
            } else if distanceKm < 400 {
                return "London to Paris"
            } else if distanceKm < 4000 {
                return "Route 66"
            } else {
                return Level.earthEquivalent(for: distanceMeters)
            }
        }
    }
}

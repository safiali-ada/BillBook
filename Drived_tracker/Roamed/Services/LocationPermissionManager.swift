import Foundation
import CoreLocation
import Observation

@Observable
final class LocationPermissionManager: NSObject, CLLocationManagerDelegate {
    
    private let locationManager = CLLocationManager()
    
    var authorizationStatus: CLAuthorizationStatus = .notDetermined
    
    var statusDescription: String {
        switch authorizationStatus {
        case .notDetermined:
            return "Permission not requested yet."
        case .restricted:
            return "Location access is restricted."
        case .denied:
            return "Location access was denied. Please enable it in Settings."
        case .authorizedAlways:
            return "Always access granted. Ready for background tracking."
        case .authorizedWhenInUse:
            return "When In Use access granted. Upgrade to Always for background tracking."
        @unknown default:
            return "Unknown status."
        }
    }
    
    var isFullyAuthorized: Bool {
        authorizationStatus == .authorizedAlways
    }
    
    override init() {
        super.init()
        locationManager.delegate = self
        authorizationStatus = locationManager.authorizationStatus
    }
    
    func requestWhenInUsePermission() {
        locationManager.requestWhenInUseAuthorization()
    }
    
    func requestAlwaysPermission() {
        locationManager.requestAlwaysAuthorization()
    }
    
    // MARK: - CLLocationManagerDelegate
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        self.authorizationStatus = manager.authorizationStatus
    }
}

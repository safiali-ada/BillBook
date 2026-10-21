import Foundation
import CoreBluetooth
import Observation
import OSLog

@Observable
final class DriverDetectionService: NSObject, CBCentralManagerDelegate {
    
    private var centralManager: CBCentralManager!
    private let logger = Logger(subsystem: "com.roamed.app", category: "DriverDetection")
    
    private let knownCarsKey = "roamed_known_cars"
    
    /// List of UUID strings for known car Bluetooth devices
    private(set) var knownCarIdentifiers: [String] = []
    
    /// Currently connected known car identifier, if any
    private(set) var connectedCarIdentifier: String?
    
    /// Computed property indicating if the user is likely the driver based on connection to a known car
    var isDriver: Bool {
        connectedCarIdentifier != nil
    }
    
    override init() {
        super.init()
        loadKnownCars()
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }
    
    // MARK: - Managing Known Cars
    
    private func loadKnownCars() {
        if let saved = UserDefaults.standard.stringArray(forKey: knownCarsKey) {
            knownCarIdentifiers = saved
        }
    }
    
    func saveCarBluetoothIdentifier(_ identifier: String) {
        if !knownCarIdentifiers.contains(identifier) {
            knownCarIdentifiers.append(identifier)
            UserDefaults.standard.set(knownCarIdentifiers, forKey: knownCarsKey)
            logger.info("Saved new car Bluetooth identifier: \(identifier)")
            
            // Re-evaluate current connection
            if connectedCarIdentifier == nil {
                checkConnectedPeripherals()
            }
        }
    }
    
    func checkConnectedPeripherals() {
        guard centralManager.state == .poweredOn else { return }
        
        let uuids = knownCarIdentifiers.compactMap { UUID(uuidString: $0) }
        guard !uuids.isEmpty else { return }
        
        let connectedPeripherals = centralManager.retrievePeripherals(withIdentifiers: uuids)
        
        if let connectedCar = connectedPeripherals.first {
            connectedCarIdentifier = connectedCar.identifier.uuidString
            logger.info("Connected to known car: \(connectedCar.identifier.uuidString)")
        } else {
            connectedCarIdentifier = nil
            logger.info("Not connected to any known cars.")
        }
    }
    
    // MARK: - CBCentralManagerDelegate
    
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        switch central.state {
        case .poweredOn:
            checkConnectedPeripherals()
        default:
            connectedCarIdentifier = nil
        }
    }
}

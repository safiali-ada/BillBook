import SwiftUI

/// Post-drive mood selection.
/// Only `.relaxing` and `.fun` are logged as Mindful Minutes in HealthKit.
enum DriveMood: String, Codable, CaseIterable, Identifiable {
    case relaxing
    case focused
    case stressful
    case fun

    var id: String { rawValue }

    var emoji: String {
        switch self {
        case .relaxing:  "😌"
        case .focused:   "🎯"
        case .stressful: "😤"
        case .fun:       "🎉"
        }
    }

    var label: String {
        switch self {
        case .relaxing:  "Relaxing"
        case .focused:   "Focused"
        case .stressful: "Stressful"
        case .fun:       "Fun"
        }
    }

    var color: Color {
        switch self {
        case .relaxing:  .teal
        case .focused:   .orange
        case .stressful: .red
        case .fun:       .yellow
        }
    }

    /// Whether this mood qualifies for HealthKit Mindful Minutes logging.
    var isMindful: Bool {
        switch self {
        case .relaxing, .fun: true
        case .focused, .stressful: false
        }
    }
}

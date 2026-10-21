import SwiftUI

struct HeatmapView: View {
    let drives: [Drive]
    
    var body: some View {
        VStack(alignment: .leading) {
            Text("Activity")
                .font(.headline)
            
            ScrollView(.horizontal, showsIndicators: false) {
                LazyHGrid(rows: Array(repeating: GridItem(.fixed(16), spacing: 4), count: 7), spacing: 4) {
                    ForEach(0..<90) { dayOffset in
                        let date = Calendar.current.date(byAdding: .day, value: -89 + dayOffset, to: Date())!
                        let distance = distanceFor(date: date)
                        RoundedRectangle(cornerRadius: 4)
                            .fill(colorFor(distance: distance))
                            .frame(width: 16, height: 16)
                    }
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
        .padding(.horizontal)
    }
    
    private func distanceFor(date: Date) -> Double {
        let drivesOnDate = drives.filter { Calendar.current.isDate($0.startDate, inSameDayAs: date) }
        return drivesOnDate.reduce(0) { $0 + $1.distanceKm }
    }
    
    private func colorFor(distance: Double) -> Color {
        if distance == 0 {
            return Color(.tertiarySystemFill)
        } else if distance < 10 {
            return .teal.opacity(0.3)
        } else if distance < 50 {
            return .teal.opacity(0.6)
        } else {
            return .teal
        }
    }
}

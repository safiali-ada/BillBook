import SwiftUI

struct OdometerView: View {
    let distance: Double
    let unit: String
    
    private var formattedValue: String {
        String(format: "%06.0f", distance)
    }
    
    var body: some View {
        HStack(alignment: .lastTextBaseline, spacing: 4) {
            HStack(spacing: 2) {
                ForEach(Array(formattedValue.enumerated()), id: \.offset) { index, char in
                    OdometerDigit(digit: Int(String(char)) ?? 0)
                }
            }
            .background(Color(.darkGray))
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color(.systemGray3), lineWidth: 2)
            )
            
            Text(unit)
                .font(.headline)
                .foregroundStyle(.secondary)
        }
    }
}

struct OdometerDigit: View {
    let digit: Int
    
    var body: some View {
        Text("\(digit)")
            .font(.system(size: 40, weight: .bold, design: .monospaced))
            .foregroundStyle(.white)
            .frame(width: 32, height: 50)
            .background(Color.black)
            .contentTransition(.numericText())
            .animation(.spring(), value: digit)
            .sensoryFeedback(.selection, trigger: digit)
    }
}

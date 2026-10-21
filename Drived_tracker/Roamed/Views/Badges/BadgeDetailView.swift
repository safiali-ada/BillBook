import SwiftUI

struct BadgeDetailView: View {
    let badgeType: BadgeType
    let earnedBadge: Badge?
    
    var body: some View {
        VStack(spacing: 24) {
            ZStack {
                if earnedBadge != nil {
                    Circle()
                        .fill(Color.orange.opacity(0.3))
                        .frame(width: 150, height: 150)
                        .blur(radius: 20)
                }
                
                Image(systemName: badgeType.systemIconName)
                    .font(.system(size: 80))
                    .foregroundStyle(earnedBadge != nil ? Color.orange : Color.gray)
            }
            .padding(.top, 40)
            
            VStack(spacing: 8) {
                Text(badgeType.title)
                    .font(.largeTitle.bold())
                
                Text(badgeType.category.label.uppercased())
                    .font(.caption.bold())
                    .foregroundStyle(.secondary)
            }
            
            Text(badgeType.description)
                .font(.body)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            if let earned = earnedBadge {
                Text("Earned on \(earned.earnedDate.formatted(date: .long, time: .omitted))")
                    .font(.subheadline)
                    .foregroundStyle(.green)
                    .padding()
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(8)
                
                ShareLink(item: "I just earned the \(badgeType.title) badge in Roamed!") {
                    Label("Share", systemImage: "square.and.arrow.up")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.orange)
                        .foregroundStyle(.white)
                        .cornerRadius(12)
                }
                .padding(.horizontal, 40)
            } else {
                Text("Not yet earned")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(8)
            }
            
            Spacer()
        }
        .padding()
        .navigationBarTitleDisplayMode(.inline)
    }
}

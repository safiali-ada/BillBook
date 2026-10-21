import SwiftUI
import SwiftData
import TipKit

struct BadgeDiscoveryTip: Tip {
    var title: Text {
        Text("Earn Badges")
    }
    var message: Text? {
        Text("Drive safely, hit milestones, and maintain streaks to unlock these badges.")
    }
    var image: Image? {
        Image(systemName: "medal.fill")
    }
}

struct BadgeCollectionView: View {
    @Query private var earnedBadges: [Badge]
    @State private var selectedCategory: BadgeCategory? = nil
    
    let columns = [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())]
    
    var filteredBadges: [BadgeType] {
        if let category = selectedCategory {
            return BadgeType.allCases.filter { $0.category == category }
        }
        return BadgeType.allCases
    }
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            FilterChip(title: "All", isSelected: selectedCategory == nil) {
                                selectedCategory = nil
                            }
                            ForEach(BadgeCategory.allCases) { category in
                                FilterChip(title: category.label, isSelected: selectedCategory == category) {
                                    selectedCategory = category
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                    .padding(.top, 8)
                    
                    Text("\(earnedBadges.count) / \(BadgeType.allCases.count) Earned")
                        .font(.headline)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)
                    
                    TipView(BadgeDiscoveryTip())
                        .padding(.horizontal)
                        .tint(.orange)
                    
                    LazyVGrid(columns: columns, spacing: 24) {
                        ForEach(filteredBadges) { badgeType in
                            let earned = earnedBadges.first(where: { $0.badgeType == badgeType })
                            NavigationLink(destination: BadgeDetailView(badgeType: badgeType, earnedBadge: earned)) {
                                BadgeIconView(badgeType: badgeType, isEarned: earned != nil, isNew: earned?.isNew == true)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal)
                }
            }
            .safeAreaPadding(.bottom, 120) // iOS 18 floating tab bar clearance
            .navigationTitle("Badges")
            .background(Color(.systemBackground))
        }
    }
}

struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline.bold())
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.orange : Color(.secondarySystemBackground))
                .foregroundStyle(isSelected ? .white : .primary)
                .clipShape(Capsule())
        }
    }
}

struct BadgeIconView: View {
    let badgeType: BadgeType
    let isEarned: Bool
    let isNew: Bool
    
    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(isEarned ? Color.orange.opacity(0.2) : Color(.secondarySystemBackground))
                    .frame(width: 80, height: 80)
                
                Image(systemName: badgeType.systemIconName)
                    .font(.system(size: 32))
                    .foregroundStyle(isEarned ? Color.orange : Color.gray)
                
                if isNew {
                    Circle()
                        .fill(Color.red)
                        .frame(width: 14, height: 14)
                        .overlay(Circle().stroke(Color(.systemBackground), lineWidth: 2))
                        .offset(x: 28, y: -28)
                }
                
                if !isEarned {
                    Image(systemName: "lock.fill")
                        .font(.caption)
                        .foregroundStyle(.gray)
                        .padding(6)
                        .background(Color(.systemBackground))
                        .clipShape(Circle())
                        .offset(x: 24, y: 24)
                }
            }
            
            Text(badgeType.title)
                .font(.caption)
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.8)
                .frame(height: 32, alignment: .top)
        }
    }
}

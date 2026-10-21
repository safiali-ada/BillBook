#!/usr/bin/env ruby
# generate_xcodeproj.rb — Creates a minimal Roamed.xcodeproj

require 'fileutils'

PROJECT_DIR = File.expand_path('..', __FILE__)
XCODEPROJ_DIR = File.join(PROJECT_DIR, 'Roamed.xcodeproj')
PBXPROJ = File.join(XCODEPROJ_DIR, 'project.pbxproj')

# Collect all .swift source files
source_dir = File.join(PROJECT_DIR, 'Roamed')
swift_files = Dir.glob(File.join(source_dir, '**', '*.swift')).sort
# Exclude Widget files since they belong in an extension target
swift_files.reject! { |f| f.include?('/Widgets/') }

# Generate deterministic UUIDs
def make_id(seed)
  require 'digest'
  Digest::MD5.hexdigest(seed)[0, 24].upcase
end

# IDs
project_id = make_id('project')
main_group_id = make_id('mainGroup')
sources_group_id = make_id('sourcesGroup')
products_group_id = make_id('productsGroup')
target_id = make_id('target')
build_config_list_project_id = make_id('buildConfigListProject')
build_config_list_target_id = make_id('buildConfigListTarget')
debug_config_project_id = make_id('debugConfigProject')
release_config_project_id = make_id('releaseConfigProject')
debug_config_target_id = make_id('debugConfigTarget')
release_config_target_id = make_id('releaseConfigTarget')
sources_phase_id = make_id('sourcesPhase')
resources_phase_id = make_id('resourcesPhase')
frameworks_phase_id = make_id('frameworksPhase')
product_ref_id = make_id('productRef')
assets_ref_id = make_id('assetsRef')
assets_build_id = make_id('assetsBuild')

# Map files to IDs
file_refs = {}
build_files = {}
swift_files.each do |f|
  rel = f.sub(source_dir + '/', '')
  file_refs[f] = make_id("fileRef:#{rel}")
  build_files[f] = make_id("buildFile:#{rel}")
end

FileUtils.mkdir_p(XCODEPROJ_DIR)

File.open(PBXPROJ, 'w') do |out|
  out.puts '// !$*UTF8*$!'
  out.puts '{'
  out.puts '  archiveVersion = 1;'
  out.puts '  classes = {};'
  out.puts '  objectVersion = 56;'
  out.puts '  objects = {'
  out.puts ''

  # PBXBuildFile
  out.puts '/* Begin PBXBuildFile section */'
  swift_files.each do |f|
    rel = f.sub(source_dir + '/', '')
    out.puts "    #{build_files[f]} /* #{File.basename(f)} in Sources */ = {isa = PBXBuildFile; fileRef = #{file_refs[f]}; };"
  end
  out.puts "    #{assets_build_id} /* Assets.xcassets in Resources */ = {isa = PBXBuildFile; fileRef = #{assets_ref_id}; };"
  out.puts '/* End PBXBuildFile section */'
  out.puts ''

  # PBXFileReference
  out.puts '/* Begin PBXFileReference section */'
  swift_files.each do |f|
    rel = f.sub(source_dir + '/', '')
    out.puts "    #{file_refs[f]} /* #{File.basename(f)} */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = \"#{rel}\"; sourceTree = \"<group>\"; };"
  end
  out.puts "    #{assets_ref_id} /* Assets.xcassets */ = {isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = \"<group>\"; };"
  out.puts "    #{product_ref_id} /* Roamed.app */ = {isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = Roamed.app; sourceTree = BUILT_PRODUCTS_DIR; };"
  out.puts '/* End PBXFileReference section */'
  out.puts ''

  # PBXGroup
  out.puts '/* Begin PBXGroup section */'
  out.puts "    #{main_group_id} = {"
  out.puts '      isa = PBXGroup;'
  out.puts '      children = ('
  out.puts "        #{sources_group_id},"
  out.puts "        #{products_group_id},"
  out.puts '      );'
  out.puts '      sourceTree = "<group>";'
  out.puts '    };'

  out.puts "    #{sources_group_id} /* Roamed */ = {"
  out.puts '      isa = PBXGroup;'
  out.puts '      children = ('
  swift_files.each { |f| out.puts "        #{file_refs[f]}," }
  out.puts "        #{assets_ref_id},"
  out.puts '      );'
  out.puts '      path = Roamed;'
  out.puts '      sourceTree = "<group>";'
  out.puts '    };'

  out.puts "    #{products_group_id} /* Products */ = {"
  out.puts '      isa = PBXGroup;'
  out.puts '      children = ('
  out.puts "        #{product_ref_id},"
  out.puts '      );'
  out.puts '      name = Products;'
  out.puts '      sourceTree = "<group>";'
  out.puts '    };'
  out.puts '/* End PBXGroup section */'
  out.puts ''

  # PBXNativeTarget
  out.puts '/* Begin PBXNativeTarget section */'
  out.puts "    #{target_id} /* Roamed */ = {"
  out.puts '      isa = PBXNativeTarget;'
  out.puts "      buildConfigurationList = #{build_config_list_target_id};"
  out.puts '      buildPhases = ('
  out.puts "        #{sources_phase_id},"
  out.puts "        #{resources_phase_id},"
  out.puts "        #{frameworks_phase_id},"
  out.puts '      );'
  out.puts '      buildRules = ();'
  out.puts '      dependencies = ();'
  out.puts '      name = Roamed;'
  out.puts "      productName = Roamed;"
  out.puts "      productReference = #{product_ref_id};"
  out.puts '      productType = "com.apple.product-type.application";'
  out.puts '    };'
  out.puts '/* End PBXNativeTarget section */'
  out.puts ''

  # PBXProject
  out.puts '/* Begin PBXProject section */'
  out.puts "    #{project_id} /* Project object */ = {"
  out.puts '      isa = PBXProject;'
  out.puts "      buildConfigurationList = #{build_config_list_project_id};"
  out.puts '      compatibilityVersion = "Xcode 14.0";'
  out.puts '      developmentRegion = en;'
  out.puts '      hasScannedForEncodings = 0;'
  out.puts '      knownRegions = (en, Base);'
  out.puts "      mainGroup = #{main_group_id};"
  out.puts "      productRefGroup = #{products_group_id};"
  out.puts '      projectDirPath = "";'
  out.puts '      projectRoot = "";'
  out.puts '      targets = ('
  out.puts "        #{target_id},"
  out.puts '      );'
  out.puts '    };'
  out.puts '/* End PBXProject section */'
  out.puts ''

  # PBXSourcesBuildPhase
  out.puts '/* Begin PBXSourcesBuildPhase section */'
  out.puts "    #{sources_phase_id} = {"
  out.puts '      isa = PBXSourcesBuildPhase;'
  out.puts '      buildActionMask = 2147483647;'
  out.puts '      files = ('
  swift_files.each { |f| out.puts "        #{build_files[f]}," }
  out.puts '      );'
  out.puts '      runOnlyForDeploymentPostprocessing = 0;'
  out.puts '    };'
  out.puts '/* End PBXSourcesBuildPhase section */'
  out.puts ''

  # PBXResourcesBuildPhase
  out.puts '/* Begin PBXResourcesBuildPhase section */'
  out.puts "    #{resources_phase_id} = {"
  out.puts '      isa = PBXResourcesBuildPhase;'
  out.puts '      buildActionMask = 2147483647;'
  out.puts '      files = ('
  out.puts "        #{assets_build_id},"
  out.puts '      );'
  out.puts '      runOnlyForDeploymentPostprocessing = 0;'
  out.puts '    };'
  out.puts '/* End PBXResourcesBuildPhase section */'
  out.puts ''

  # PBXFrameworksBuildPhase
  out.puts '/* Begin PBXFrameworksBuildPhase section */'
  out.puts "    #{frameworks_phase_id} = {"
  out.puts '      isa = PBXFrameworksBuildPhase;'
  out.puts '      buildActionMask = 2147483647;'
  out.puts '      files = ();'
  out.puts '      runOnlyForDeploymentPostprocessing = 0;'
  out.puts '    };'
  out.puts '/* End PBXFrameworksBuildPhase section */'
  out.puts ''

  # XCBuildConfiguration
  out.puts '/* Begin XCBuildConfiguration section */'

  # Project-level Debug
  out.puts "    #{debug_config_project_id} /* Debug */ = {"
  out.puts '      isa = XCBuildConfiguration;'
  out.puts '      buildSettings = {'
  out.puts '        ALWAYS_SEARCH_USER_PATHS = NO;'
  out.puts '        CLANG_ENABLE_MODULES = YES;'
  out.puts '        CLANG_ENABLE_OBJC_ARC = YES;'
  out.puts '        COPY_PHASE_STRIP = NO;'
  out.puts '        DEBUG_INFORMATION_FORMAT = dwarf;'
  out.puts '        GCC_OPTIMIZATION_LEVEL = 0;'
  out.puts '        MTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;'
  out.puts '        ONLY_ACTIVE_ARCH = YES;'
  out.puts '        SDKROOT = iphoneos;'
  out.puts '        SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;'
  out.puts '        SWIFT_OPTIMIZATION_LEVEL = "-Onone";'
  out.puts '      };'
  out.puts '      name = Debug;'
  out.puts '    };'

  # Project-level Release
  out.puts "    #{release_config_project_id} /* Release */ = {"
  out.puts '      isa = XCBuildConfiguration;'
  out.puts '      buildSettings = {'
  out.puts '        ALWAYS_SEARCH_USER_PATHS = NO;'
  out.puts '        CLANG_ENABLE_MODULES = YES;'
  out.puts '        CLANG_ENABLE_OBJC_ARC = YES;'
  out.puts '        COPY_PHASE_STRIP = NO;'
  out.puts '        DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";'
  out.puts '        ENABLE_NS_ASSERTIONS = NO;'
  out.puts '        MTL_ENABLE_DEBUG_INFO = NO;'
  out.puts '        SDKROOT = iphoneos;'
  out.puts '        SWIFT_OPTIMIZATION_LEVEL = "-O";'
  out.puts '        VALIDATE_PRODUCT = YES;'
  out.puts '      };'
  out.puts '      name = Release;'
  out.puts '    };'

  # Target-level Debug
  out.puts "    #{debug_config_target_id} /* Debug */ = {"
  out.puts '      isa = XCBuildConfiguration;'
  out.puts '      buildSettings = {'
  out.puts '        ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;'
  out.puts '        ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;'
  out.puts '        CODE_SIGN_STYLE = Automatic;'
  out.puts '        CURRENT_PROJECT_VERSION = 1;'
  out.puts '        DEVELOPMENT_TEAM = "";'
  out.puts '        GENERATE_INFOPLIST_FILE = YES;'
  out.puts '        INFOPLIST_KEY_CFBundleDisplayName = Roamed;'
  out.puts '        INFOPLIST_KEY_LSApplicationCategoryType = "public.app-category.travel";'
  out.puts '        INFOPLIST_KEY_NSLocationAlwaysAndWhenInUseUsageDescription = "Roamed tracks your driving distance in the background to log your lifetime kilometers.";'
  out.puts '        INFOPLIST_KEY_NSLocationWhenInUseUsageDescription = "Roamed needs location access to measure the distance of your drives.";'
  out.puts '        INFOPLIST_KEY_NSMotionUsageDescription = "Roamed uses motion data to automatically detect when you start and stop driving.";'
  out.puts '        INFOPLIST_KEY_NSHealthShareUsageDescription = "Roamed can log relaxing drives as mindful minutes in Apple Health.";'
  out.puts '        INFOPLIST_KEY_NSHealthUpdateUsageDescription = "Roamed can log relaxing drives as mindful minutes in Apple Health.";'
  out.puts '        INFOPLIST_KEY_UIApplicationSceneManifest_Generation = YES;'
  out.puts '        INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents = YES;'
  out.puts '        INFOPLIST_KEY_UILaunchScreen_Generation = YES;'
  out.puts '        INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad = "UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";'
  out.puts '        INFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone = "UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";'
  out.puts '        IPHONEOS_DEPLOYMENT_TARGET = 17.0;'
  out.puts '        LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks";'
  out.puts '        MARKETING_VERSION = 1.0;'
  out.puts '        PRODUCT_BUNDLE_IDENTIFIER = com.roamed.app;'
  out.puts '        PRODUCT_NAME = "$(TARGET_NAME)";'
  out.puts '        SWIFT_EMIT_LOC_STRINGS = YES;'
  out.puts '        SWIFT_VERSION = 5.0;'
  out.puts '        TARGETED_DEVICE_FAMILY = "1,2";'
  out.puts '        ENABLE_USER_SCRIPT_SANDBOXING = YES;'
  out.puts '      };'
  out.puts '      name = Debug;'
  out.puts '    };'

  # Target-level Release
  out.puts "    #{release_config_target_id} /* Release */ = {"
  out.puts '      isa = XCBuildConfiguration;'
  out.puts '      buildSettings = {'
  out.puts '        ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;'
  out.puts '        ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;'
  out.puts '        CODE_SIGN_STYLE = Automatic;'
  out.puts '        CURRENT_PROJECT_VERSION = 1;'
  out.puts '        DEVELOPMENT_TEAM = "";'
  out.puts '        GENERATE_INFOPLIST_FILE = YES;'
  out.puts '        INFOPLIST_KEY_CFBundleDisplayName = Roamed;'
  out.puts '        INFOPLIST_KEY_LSApplicationCategoryType = "public.app-category.travel";'
  out.puts '        INFOPLIST_KEY_NSLocationAlwaysAndWhenInUseUsageDescription = "Roamed tracks your driving distance in the background to log your lifetime kilometers.";'
  out.puts '        INFOPLIST_KEY_NSLocationWhenInUseUsageDescription = "Roamed needs location access to measure the distance of your drives.";'
  out.puts '        INFOPLIST_KEY_NSMotionUsageDescription = "Roamed uses motion data to automatically detect when you start and stop driving.";'
  out.puts '        INFOPLIST_KEY_NSHealthShareUsageDescription = "Roamed can log relaxing drives as mindful minutes in Apple Health.";'
  out.puts '        INFOPLIST_KEY_NSHealthUpdateUsageDescription = "Roamed can log relaxing drives as mindful minutes in Apple Health.";'
  out.puts '        INFOPLIST_KEY_UIApplicationSceneManifest_Generation = YES;'
  out.puts '        INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents = YES;'
  out.puts '        INFOPLIST_KEY_UILaunchScreen_Generation = YES;'
  out.puts '        INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad = "UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";'
  out.puts '        INFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone = "UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";'
  out.puts '        IPHONEOS_DEPLOYMENT_TARGET = 17.0;'
  out.puts '        LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks";'
  out.puts '        MARKETING_VERSION = 1.0;'
  out.puts '        PRODUCT_BUNDLE_IDENTIFIER = com.roamed.app;'
  out.puts '        PRODUCT_NAME = "$(TARGET_NAME)";'
  out.puts '        SWIFT_EMIT_LOC_STRINGS = YES;'
  out.puts '        SWIFT_VERSION = 5.0;'
  out.puts '        TARGETED_DEVICE_FAMILY = "1,2";'
  out.puts '        ENABLE_USER_SCRIPT_SANDBOXING = YES;'
  out.puts '      };'
  out.puts '      name = Release;'
  out.puts '    };'

  out.puts '/* End XCBuildConfiguration section */'
  out.puts ''

  # XCConfigurationList
  out.puts '/* Begin XCConfigurationList section */'
  out.puts "    #{build_config_list_project_id} = {"
  out.puts '      isa = XCConfigurationList;'
  out.puts '      buildConfigurations = ('
  out.puts "        #{debug_config_project_id},"
  out.puts "        #{release_config_project_id},"
  out.puts '      );'
  out.puts '      defaultConfigurationIsVisible = 0;'
  out.puts '      defaultConfigurationName = Release;'
  out.puts '    };'
  out.puts "    #{build_config_list_target_id} = {"
  out.puts '      isa = XCConfigurationList;'
  out.puts '      buildConfigurations = ('
  out.puts "        #{debug_config_target_id},"
  out.puts "        #{release_config_target_id},"
  out.puts '      );'
  out.puts '      defaultConfigurationIsVisible = 0;'
  out.puts '      defaultConfigurationName = Release;'
  out.puts '    };'
  out.puts '/* End XCConfigurationList section */'
  out.puts ''

  out.puts '  };'
  out.puts "  rootObject = #{project_id};"
  out.puts '}'
end

puts "Generated #{PBXPROJ}"
puts "#{swift_files.length} source files included"

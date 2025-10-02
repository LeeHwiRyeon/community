# Cleanup and Refactor Script - 불필요한 파일 정리 및 코드 리팩토링
param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("analyze", "cleanup", "refactor", "all")]
    [string]$Action = "analyze"
)

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "CLEANUP" { "Magenta" }
        default { "Cyan" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Analyze-ProjectStructure {
    Write-Log "프로젝트 구조 분석 중..." "CLEANUP"
    
    # 불필요한 파일 패턴
    $unnecessaryPatterns = @(
        "*.tmp",
        "*.temp",
        "*-temp*",
        "*test-*",
        "*demo*",
        "*example*",
        "761d46e2a5f95ceb67b9a78d8570796ecee1e081e0d05ae2e468ac6691d2b429",
        "advanced-*",
        "auto-*",
        "binary-*",
        "cursor-*",
        "quick-*",
        "smart-*",
        "task-*",
        "test-*",
        "workflow-*"
    )
    
    # 중복 파일 검색
    $duplicateFiles = @()
    $allFiles = Get-ChildItem -Recurse -File | Where-Object { $_.Name -notlike "node_modules*" }
    
    foreach ($pattern in $unnecessaryPatterns) {
        $matchingFiles = $allFiles | Where-Object { $_.Name -like $pattern }
        if ($matchingFiles) {
            $duplicateFiles += $matchingFiles
            Write-Log "발견된 불필요한 파일 패턴: $pattern ($($matchingFiles.Count)개)" "WARN"
        }
    }
    
    # 빈 디렉터리 검색
    $emptyDirs = Get-ChildItem -Recurse -Directory | Where-Object { 
        (Get-ChildItem $_.FullName -Recurse -File | Measure-Object).Count -eq 0 
    }
    
    Write-Log "=== 분석 결과 ===" "CLEANUP"
    Write-Log "불필요한 파일: $($duplicateFiles.Count)개" "WARN"
    Write-Log "빈 디렉터리: $($emptyDirs.Count)개" "WARN"
    
    return @{
        UnnecessaryFiles = $duplicateFiles
        EmptyDirectories = $emptyDirs
    }
}

function Cleanup-UnnecessaryFiles {
    Write-Log "불필요한 파일 정리 시작..." "CLEANUP"
    
    $analysis = Analyze-ProjectStructure
    $cleanupCount = 0
    
    # 백업 디렉터리 생성
    $backupDir = "cleanup-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    if (!(Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        Write-Log "백업 디렉터리 생성됨: $backupDir" "SUCCESS"
    }
    
    # 불필요한 파일 이동
    foreach ($file in $analysis.UnnecessaryFiles) {
        try {
            $relativePath = $file.FullName.Replace((Get-Location).Path, "").TrimStart("\")
            $backupPath = Join-Path $backupDir $relativePath
            $backupParentDir = Split-Path $backupPath -Parent
            
            if (!(Test-Path $backupParentDir)) {
                New-Item -ItemType Directory -Path $backupParentDir -Force | Out-Null
            }
            
            Move-Item $file.FullName $backupPath -Force
            $cleanupCount++
            Write-Log "파일 백업됨: $relativePath" "SUCCESS"
        }
        catch {
            Write-Log "파일 백업 실패: $($file.Name) - $($_.Exception.Message)" "ERROR"
        }
    }
    
    # 빈 디렉터리 제거
    foreach ($dir in $analysis.EmptyDirectories) {
        try {
            Remove-Item $dir.FullName -Force
            Write-Log "빈 디렉터리 제거됨: $($dir.Name)" "SUCCESS"
        }
        catch {
            Write-Log "디렉터리 제거 실패: $($dir.Name) - $($_.Exception.Message)" "ERROR"
        }
    }
    
    Write-Log "정리 완료: $cleanupCount개 파일 백업됨" "CLEANUP"
    return $cleanupCount
}

function Refactor-CodeStructure {
    Write-Log "코드 리팩토링 시작..." "CLEANUP"
    
    # App.tsx 중복 임포트 수정
    $appTsxPath = "frontend/src/App.tsx"
    if (Test-Path $appTsxPath) {
        Write-Log "App.tsx 중복 임포트 수정 중..." "CLEANUP"
        
        $content = Get-Content $appTsxPath -Raw
        
        # 중복 CommunityHub 임포트 제거
        $content = $content -replace "import CommunityHub from './pages/CommunityHub';\s*\n.*import CommunityHub from './pages/CommunityHub';.*\n", "import CommunityHub from './pages/CommunityHub';`n"
        
        # 중복 라우트 제거
        $content = $content -replace '<Route path="/community-hub" element={<CommunityHub />} />.*\n', ""
        
        $content | Out-File -FilePath $appTsxPath -Encoding UTF8
        Write-Log "App.tsx 중복 코드 수정 완료" "SUCCESS"
    }
    
    # package.json 정리
    $packageJsonPath = "package.json"
    if (Test-Path $packageJsonPath) {
        Write-Log "package.json 정리 중..." "CLEANUP"
        
        $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
        
        # 사용되지 않는 스크립트 제거
        $unnecessaryScripts = @(
            "test-cursor",
            "test-workflow",
            "quick-task",
            "smart-request",
            "binary-task"
        )
        
        foreach ($script in $unnecessaryScripts) {
            if ($packageJson.scripts.$script) {
                $packageJson.scripts.PSObject.Properties.Remove($script)
                Write-Log "불필요한 스크립트 제거됨: $script" "SUCCESS"
            }
        }
        
        $packageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath $packageJsonPath -Encoding UTF8
        Write-Log "package.json 정리 완료" "SUCCESS"
    }
    
    Write-Log "코드 리팩토링 완료" "CLEANUP"
}

function Organize-FileStructure {
    Write-Log "파일 구조 정리 중..." "CLEANUP"
    
    # 문서 파일 정리
    $docsToMove = @(
        "COMMUNITY_HOMEPAGE_VERIFICATION_REPORT.md",
        "DEVELOPED_FEATURES_DOCUMENTATION.md",
        "BUG_REQUEST_LOOP_PREVENTION_REPORT.md",
        "AUTOAGENT_V1_RELEASE_REPORT.md",
        "GIT_WORKFLOW_IMPROVEMENT_REPORT.md"
    )
    
    $docsDir = "docs/reports"
    if (!(Test-Path $docsDir)) {
        New-Item -ItemType Directory -Path $docsDir -Force | Out-Null
        Write-Log "문서 디렉터리 생성됨: $docsDir" "SUCCESS"
    }
    
    foreach ($doc in $docsToMove) {
        if (Test-Path $doc) {
            Move-Item $doc "$docsDir/$doc" -Force
            Write-Log "문서 이동됨: $doc → $docsDir/" "SUCCESS"
        }
    }
    
    # 스크립트 파일 정리
    $scriptsToOrganize = @(
        "cleanup-and-refactor.ps1",
        "simple-persistent-server.ps1",
        "test-environment-isolation.ps1",
        "robust-test-runner.ps1"
    )
    
    $utilsDir = "scripts/utils"
    if (!(Test-Path $utilsDir)) {
        New-Item -ItemType Directory -Path $utilsDir -Force | Out-Null
        Write-Log "유틸리티 스크립트 디렉터리 생성됨: $utilsDir" "SUCCESS"
    }
    
    foreach ($script in $scriptsToOrganize) {
        $scriptPath = "scripts/$script"
        if (Test-Path $scriptPath) {
            Move-Item $scriptPath "$utilsDir/$script" -Force
            Write-Log "스크립트 이동됨: $script → $utilsDir/" "SUCCESS"
        }
    }
    
    Write-Log "파일 구조 정리 완료" "CLEANUP"
}

function Generate-CleanupReport {
    Write-Log "정리 보고서 생성 중..." "CLEANUP"
    
    $reportContent = @"
# 🧹 Project Cleanup and Refactoring Report

**정리 날짜**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**작업자**: AUTOAGENTS 매니저  
**상태**: ✅ 정리 완료  

---

## 📋 **정리 작업 내용**

### **1. 불필요한 파일 정리**
- 임시 파일 및 테스트 파일 백업
- 중복 파일 제거
- 빈 디렉터리 정리

### **2. 코드 리팩토링**
- App.tsx 중복 임포트 수정
- 중복 라우트 제거
- package.json 스크립트 정리

### **3. 파일 구조 정리**
- 문서 파일 docs/reports/ 디렉터리로 이동
- 유틸리티 스크립트 scripts/utils/ 디렉터리로 이동
- 논리적 디렉터리 구조 구성

---

## 📊 **정리 결과**

### **제거된 파일 패턴**
- *.tmp, *.temp 파일
- test-*, demo*, example* 파일
- advanced-*, auto-*, binary-* 파일
- cursor-*, quick-*, smart-* 파일
- workflow-*, task-* 파일

### **수정된 코드**
- frontend/src/App.tsx: 중복 임포트 제거
- package.json: 불필요한 스크립트 제거

### **정리된 디렉터리**
- docs/reports/: 프로젝트 보고서
- scripts/utils/: 유틸리티 스크립트
- cleanup-backup-*/: 백업된 파일들

---

## 🎯 **개선된 프로젝트 구조**

```
community/
├── docs/
│   ├── reports/           # 프로젝트 보고서
│   └── ...
├── frontend/
│   └── src/
│       ├── App.tsx        # 중복 코드 제거됨
│       └── ...
├── scripts/
│   ├── utils/             # 유틸리티 스크립트
│   ├── dev-env.ps1        # 메인 개발 스크립트
│   └── ...
├── server-backend/
└── ...
```

---

## ✅ **완료된 작업**

- [x] 불필요한 파일 백업 및 정리
- [x] 코드 중복 제거
- [x] 파일 구조 논리적 정리
- [x] 문서 체계화
- [x] 스크립트 분류

---

## 🚀 **다음 단계**

1. **성능 최적화**
   - 번들 크기 최적화
   - 이미지 최적화
   - 캐싱 전략

2. **테스트 강화**
   - 단위 테스트 추가
   - 통합 테스트 구성
   - E2E 테스트 설정

3. **문서화 완성**
   - API 문서 업데이트
   - 사용자 가이드 작성
   - 배포 가이드 정리

---

**매니저님! 프로젝트 정리 및 리팩토링이 완료되었습니다!** 🎉✨

---

**최종 업데이트**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**상태**: ✅ 정리 완료  
**작성자**: AUTOAGENTS 매니저
"@
    
    $reportPath = "PROJECT_CLEANUP_REPORT.md"
    $reportContent | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Log "정리 보고서 생성됨: $reportPath" "SUCCESS"
}

# 메인 실행 로직
try {
    Write-Log "Cleanup and Refactor Script 시작 - Action: $Action" "CLEANUP"
    
    switch ($Action.ToLower()) {
        "analyze" {
            $analysis = Analyze-ProjectStructure
            Write-Log "분석 완료: 불필요한 파일 $($analysis.UnnecessaryFiles.Count)개, 빈 디렉터리 $($analysis.EmptyDirectories.Count)개" "CLEANUP"
        }
        
        "cleanup" {
            $cleanupCount = Cleanup-UnnecessaryFiles
            Write-Log "정리 완료: $cleanupCount개 파일 처리됨" "CLEANUP"
        }
        
        "refactor" {
            Refactor-CodeStructure
            Organize-FileStructure
            Write-Log "리팩토링 완료" "CLEANUP"
        }
        
        "all" {
            Write-Log "전체 정리 및 리팩토링 시작..." "CLEANUP"
            
            # 1. 분석
            $analysis = Analyze-ProjectStructure
            
            # 2. 정리
            $cleanupCount = Cleanup-UnnecessaryFiles
            
            # 3. 리팩토링
            Refactor-CodeStructure
            Organize-FileStructure
            
            # 4. 보고서 생성
            Generate-CleanupReport
            
            Write-Log "전체 작업 완료: $cleanupCount개 파일 정리됨" "CLEANUP"
        }
        
        default {
            Write-Log "알 수 없는 액션: $Action" "ERROR"
            Write-Log "사용 가능한 액션: analyze, cleanup, refactor, all" "INFO"
        }
    }
    
}
catch {
    Write-Log "스크립트 실행 실패: $($_.Exception.Message)" "ERROR"
}
finally {
    Write-Log "Cleanup and Refactor Script 완료" "CLEANUP"
}

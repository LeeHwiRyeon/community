# 🔤 AUTOAGENTS UTF-8 인코딩 규칙

## 📋 필수 인코딩 규칙

### ✅ **모든 텍스트 파일은 UTF-8 (BOM 없음) 사용**

**적용 대상:**
- `.md` (마크다운 파일)
- `.js` `.ts` `.tsx` (JavaScript/TypeScript 파일)
- `.json` (JSON 파일)
- `.css` `.html` (웹 파일)
- `.txt` (텍스트 파일)
- `.yml` `.yaml` (설정 파일)

### ❌ **금지사항:**
- **UTF-8 BOM** 사용 금지
- **ANSI/CP949** 인코딩 사용 금지
- **UTF-16** 사용 금지

### 🔧 **에이전트 작업 시 준수사항:**

1. **파일 생성 시:**
   ```
   모든 새 파일은 UTF-8 (BOM 없음)으로 생성
   ```

2. **파일 수정 시:**
   ```
   기존 파일의 인코딩을 UTF-8 (BOM 없음)으로 변환 후 수정
   ```

3. **텍스트 입력/설명 시:**
   ```
   한글, 영어, 특수문자 모두 UTF-8로 처리
   ```

### 🛠️ **인코딩 변환 방법:**

**PowerShell 명령어:**
```powershell
$content = Get-Content "파일명" -Raw -Encoding UTF8
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Resolve-Path "파일명"), $content, $utf8NoBom)
```

### 📊 **검증 방법:**

**인코딩 확인:**
```powershell
Get-Content "파일명" -Encoding Byte -TotalCount 3
# UTF-8 BOM: 0xEF, 0xBB, 0xBF (금지)
# UTF-8 (BOM 없음): 일반 바이트 (권장)
```

## 🎯 **목표:**
- **모든 프로젝트 파일의 인코딩 통일**
- **다국어 지원 완벽 구현**
- **시스템 호환성 최대화**

---
**⚠️ 이 규칙은 모든 AUTOAGENTS가 반드시 준수해야 합니다!**

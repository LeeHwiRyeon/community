# 諛곗튂 ?뚯씪 ?뺣━

??臾몄꽌??Community ?꾨줈?앺듃??紐⑤뱺 諛곗튂 ?뚯씪?ㅼ쓣 ?뺣━??臾몄꽌?낅땲??

## ?좑툘 以묒슂 ?덈궡
**???댁긽 ?덈줈??諛곗튂 ?뚯씪??留뚮뱾吏 留먭퀬, 湲곗〈 諛곗튂 ?뚯씪?ㅼ쓣 ?섏젙?댁꽌 ?ъ슜?섏꽭??**

## ?묒뾽 吏移??뱥

### ?욎쑝濡쒖쓽 ?묒뾽 諛⑹떇
1. **??긽 ??臾몄꽌瑜?癒쇱? ?쎌쑝?몄슂** - ?묒뾽 ?쒖옉 ?꾩뿉 ?꾩껜 諛곗튂 ?뚯씪 援ъ“瑜??뚯븙?섏꽭??
2. **?묒뾽???댁슜???대떦?섎뒗 ?ъ씤?몃? ?곸쑝?몄슂** - ?대뼡 諛곗튂 ?뚯씪???섏젙?좎? 紐낇솗??湲곕줉?섏꽭??
3. **臾몄꽌 李몄“?섎씪怨?留곹겕 二쇱꽭??* - ?묒뾽 ?ㅻ챸??`[李몄“: BATCH_SCRIPTS.md#?뱀뀡?대쫫]` ?뺤떇?쇰줈 留곹겕瑜?異붽??섏꽭??
4. **蹂寃???利됱떆 臾몄꽌 ?낅뜲?댄듃** - 諛곗튂 ?뚯씪 ?섏젙 ????臾몄꽌???④퍡 ?낅뜲?댄듃?섏꽭??

### ?덉떆 ?묒뾽 ?ъ씤??
```
?뱧 ?묒뾽: start-all.bat ?ы듃 蹂寃?
- ????뚯씪: start-all.bat
- 변경 내용: 프런트엔드 포트를 5000으로 통일
- 李몄“: BATCH_SCRIPTS.md#硫붿씤-諛곗튂-?뚯씪-?섏뼱
- 愿???뚯씪: frontend/package.json, stop-all.bat
```

### 二쇱쓽?ы빆
- **???뚯씪 ?앹꽦 湲덉?**: 諛섎뱶??湲곗〈 ?뚯씪 ?섏젙
- **臾몄꽌 ?숆린??*: 肄붾뱶 蹂寃???臾몄꽌??利됱떆 ?낅뜲?댄듃
- **?뚯뒪????而ㅻ컠**: 蹂寃???諛섎뱶???뚯뒪?명븯怨?而ㅻ컠
- **?ы듃 ?쇨???*: start-all.bat, stop-all.bat, package.json ?ы듃 ?쇱튂 ?뺤씤

## 硫붿씤 諛곗튂 ?뚯씪 ?섏뼱

### `start-all.bat` & `stop-all.bat`
?????뚯씪???꾨줈?앺듃??硫붿씤 ?쒖옉/醫낅즺 ?ㅽ겕由쏀듃?낅땲??

#### `start-all.bat` (硫붿씤 ?쒖옉)
**紐⑹쟻**: 諛깆뿏?쒖? ?꾨줎?몄뿏?쒕? ?숈떆???ㅽ뻾
**?뱀쭠**:
- ?ы듃 異⑸룎 ?먮룞 ?뺣━
- 諛깆뿏?? ?ㅼ젣 ?쒕쾭 (`node src/index.js`)
- ?꾨줎?몄뿏?? React + Vite (`npm run dev`)
- ?ы듃: 諛깆뿏??50000, ?꾨줎?몄뿏??5000

**?댁슜**:
```bat
@echo off
echo Starting Community Full Stack Application...
echo.

REM ?ы듃 50000怨?5000???ъ슜?섎뒗 湲곗〈 ?꾨줈?몄뒪?ㅼ쓣 醫낅즺
echo [start-all] Checking and killing processes on ports 50000 and 5000...
powershell -Command "try { $pids = netstat -ano | findstr ':50000\|:5000' | ForEach-Object { $_.Split()[-1] } | Sort-Object -Unique; foreach ($pid in $pids) { if ($pid -and $pid -ne 0) { taskkill /PID $pid /F 2>$null } } } catch {}"

echo Starting Backend Server (Port 50000)...
start "Backend Server" cmd /c "cd server-backend && node src/index.js"

timeout /t 5 /nobreak > nul

echo Starting Frontend Server (Port 5000)...
start "Frontend Server" cmd /c "cd frontend && npm run dev"

echo.
echo Servers should be starting...
echo Backend: http://localhost:50000
echo Frontend: http://localhost:5000
echo.
echo Press any key to exit (servers will keep running)...
pause > nul
```

#### `stop-all.bat` (硫붿씤 醫낅즺)
**紐⑹쟻**: ?ㅽ뻾 以묒씤 紐⑤뱺 ?쒕쾭 ?ы듃 ?뺣━
**?뱀쭠**:
- ?ы듃 50000, 5000, 9323 ?ъ슜?섎뒗 ?꾨줈?몄뒪 醫낅즺
- Node.js ?꾨줈?몄뒪 ?뺣━

**?댁슜**:
```bat
@echo off
REM ?ㅽ뻾 以묒씤 紐⑤뱺 ?쒕쾭 ?ы듃瑜??ル뒗 諛곗튂 ?뚯씪

echo [stop-all] Stopping all development servers...

REM ?ы듃 50000 (諛깆뿏??, 5000 (?꾨줎?몄뿏??, 9323???ъ슜?섎뒗 ?꾨줈?몄뒪?ㅼ쓣 醫낅즺
echo [stop-all] Checking and killing processes on ports 50000, 5000, 9323...
powershell -Command "try { $pids = netstat -ano | findstr ':50000\|:5000\|:9323' | ForEach-Object { $_.Split()[-1] } | Sort-Object -Unique; foreach ($pid in $pids) { if ($pid -and $pid -ne 0) { taskkill /PID $pid /F 2>$null; Write-Host \"[stop-all] Killed process $pid\" } } } catch {}"

REM Node.js ?꾨줈?몄뒪?ㅻ룄 ?뺣━
echo [stop-all] Killing any remaining Node.js processes...
powershell -Command "try { Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; Write-Host '[stop-all] Killed Node.js processes' } catch {}"

echo [stop-all] All servers stopped.
pause
```

## 湲고? 諛곗튂 ?뚯씪??

### 媛쒕퀎 ?ㅽ뻾 ?뚯씪??
- `run-backend.bat`: 諛깆뿏?쒕쭔 ?ㅽ뻾 (?ы듃 50000)
- `run-frontend.bat`: ?꾨줎?몄뿏?쒕쭔 ?ㅽ뻾 (?ы듃 5000)
- `run-frontend-old.bat`: 援?踰꾩쟾 ?꾨줎?몄뿏???ㅽ뻾

### 紐⑹뾽/?뚯뒪???뚯씪??
- `quick-start.bat`: 紐⑹뾽 紐⑤뱶濡?鍮좊Ⅸ ?쒖옉 + 釉뚮씪?곗? ?먮룞 ?닿린
- `run-mock-all.bat`: 紐⑹뾽 紐⑤뱶 ?꾩껜 ?ㅽ뻾
- `run-mock-backend.bat`: 紐⑹뾽 諛깆뿏?쒕쭔 ?ㅽ뻾

### PowerShell ?뚯씪??
- `quick-start.ps1`: PowerShell 踰꾩쟾 鍮좊Ⅸ ?쒖옉
- `start-all.ps1`: PowerShell 踰꾩쟾 ?꾩껜 ?쒖옉
- `start-server.ps1`: PowerShell 踰꾩쟾 ?쒕쾭 ?쒖옉

### ?뚯뒪???뚯씪??
- `test-frontend.bat`: ?꾨줎?몄뿏???뚯뒪???ㅽ뻾
- `test-new-frontend.bat`: ???꾨줎?몄뿏???뚯뒪???ㅽ뻾

## ?ъ슜 沅뚯옣 ?ы빆

1. **硫붿씤 ?ъ슜**: `start-all.bat` (?쒖옉) + `stop-all.bat` (醫낅즺)
2. **鍮좊Ⅸ ?뚯뒪??*: `quick-start.bat` (紐⑹뾽 紐⑤뱶)
3. **媛쒕퀎 ?붾쾭源?*: `run-backend.bat`, `run-frontend.bat`

## ?좑툘 ?ㅼ떆 ??踰?媛뺤“
**?덈줈??諛곗튂 ?뚯씪??留뚮뱾吏 留먭퀬, `start-all.bat`怨?`stop-all.bat` ?섏뼱瑜??섏젙?댁꽌 ?ъ슜?섏꽭??**



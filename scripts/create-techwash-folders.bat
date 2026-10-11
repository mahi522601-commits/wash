@echo off
title Tech Wash Local Master Storage Auto-Setup
color 0A
cls
echo ===================================================================
echo     TECH WASH LAUNDRY SERVICES - INTERNAL STORAGE INITIALIZER
echo ===================================================================
echo Target Location: C:\TechWash
echo.
echo Creating directories on this computer...
echo.

if not exist "C:\TechWash" (
    mkdir "C:\TechWash"
    echo [OK] Created C:\TechWash
) else (
    echo [OK] C:\TechWash already exists
)

if not exist "C:\TechWash\POS-01\Data" (
    mkdir "C:\TechWash\POS-01\Data"
    mkdir "C:\TechWash\POS-01\Invoices"
    mkdir "C:\TechWash\POS-01\Exports"
    echo [OK] Created C:\TechWash\POS-01 (Main Branch - Manikonda)
)

if not exist "C:\TechWash\POS-02\Data" (
    mkdir "C:\TechWash\POS-02\Data"
    mkdir "C:\TechWash\POS-02\Invoices"
    mkdir "C:\TechWash\POS-02\Exports"
    echo [OK] Created C:\TechWash\POS-02 (Branch 1 - Tolichowki)
)

if not exist "C:\TechWash\POS-03\Data" (
    mkdir "C:\TechWash\POS-03\Data"
    mkdir "C:\TechWash\POS-03\Invoices"
    mkdir "C:\TechWash\POS-03\Exports"
    echo [OK] Created C:\TechWash\POS-03 (Pick Up Point - Ambience)
)

echo.
echo ===================================================================
echo  [SUCCESS] All Tech Wash internal storage folders are ready!
echo  Location: C:\TechWash\
echo ===================================================================
echo.
echo Opening folder in Windows File Explorer...
explorer C:\TechWash
echo.
pause

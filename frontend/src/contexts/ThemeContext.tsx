import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface Theme {
    id: string
    name: string
    primaryColor: string
    secondaryColor: string
    fontFamily: string
    layout: 'grid' | 'list'
}

interface ThemeContextType {
    currentTheme: Theme
    setTheme: (theme: Theme) => void
    customizations: {
        primaryColor: string
        secondaryColor: string
        fontFamily: string
        layout: 'grid' | 'list'
    }
    setCustomizations: (customizations: Partial<ThemeContextType['customizations']>) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const defaultTheme: Theme = {
    id: 'cosplay-character',
    name: '코스프레 캐릭터 테마',
    primaryColor: '#FF6B9D',
    secondaryColor: '#4ECDC4',
    fontFamily: 'Arial, sans-serif',
    layout: 'grid'
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme)
    const [customizations, setCustomizationsState] = useState({
        primaryColor: defaultTheme.primaryColor,
        secondaryColor: defaultTheme.secondaryColor,
        fontFamily: defaultTheme.fontFamily,
        layout: defaultTheme.layout
    })

    const setTheme = (theme: Theme) => {
        setCurrentTheme(theme)
        setCustomizationsState({
            primaryColor: theme.primaryColor,
            secondaryColor: theme.secondaryColor,
            fontFamily: theme.fontFamily,
            layout: theme.layout
        })
    }

    const setCustomizations = (newCustomizations: Partial<ThemeContextType['customizations']>) => {
        setCustomizationsState(prev => ({ ...prev, ...newCustomizations }))
    }

    // CSS Variables 적용
    React.useEffect(() => {
        const root = document.documentElement
        root.style.setProperty('--theme-primary', customizations.primaryColor)
        root.style.setProperty('--theme-secondary', customizations.secondaryColor)
        root.style.setProperty('--theme-font-family', customizations.fontFamily)
    }, [customizations])

    return (
        <ThemeContext.Provider value={{ currentTheme, setTheme, customizations, setCustomizations }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
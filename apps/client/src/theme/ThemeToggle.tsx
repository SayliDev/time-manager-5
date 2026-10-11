import { Moon, Sun } from '@gravity-ui/icons'
import { Button, Kbd, Tooltip, useTheme } from '@heroui/react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme('system')
  const isDark = resolvedTheme === 'dark'

  return (
    <Tooltip delay={300}>
      <Button
        isIconOnly
        aria-label={isDark ? 'Passer au thème clair' : 'Passer au thème sombre'}
        size="sm"
        variant="ghost"
        onPress={() => setTheme(isDark ? 'light' : 'dark')}
      >
        {isDark ? <Sun /> : <Moon />}
      </Button>
      <Tooltip.Content className="flex items-center gap-2">
        <span>{isDark ? 'Thème clair' : 'Thème sombre'}</span>
        <Kbd className="h-4 rounded-sm px-1" variant="light">
          <Kbd.Abbr keyValue="shift" />
          <Kbd.Content>D</Kbd.Content>
        </Kbd>
      </Tooltip.Content>
    </Tooltip>
  )
}

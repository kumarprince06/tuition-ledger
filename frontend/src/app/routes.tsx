import { Outlet, type RouteObject } from 'react-router'
import { AccountPage } from '../features/account/AccountPage'
import { AnnouncePage } from '../features/announce/AnnouncePage'
import { LoginPage } from '../features/auth/LoginPage'
import { SignupPage } from '../features/auth/SignupPage'
import { AttendancePage } from '../features/classes/AttendancePage'
import { ClassPage, ClassesPage } from '../features/classes/ClassesPage'
import { TodayPage } from '../features/dashboard/TodayPage'
import { FeesPage } from '../features/fees/FeesPage'
import { NotFound } from '../features/NotFound'
import { ParentDrawerProvider } from '../features/parent/ParentDrawer'
import { PlatformPage } from '../features/platform/PlatformPage'
import { ReportsPage } from '../features/reports/ReportsPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { StudentPage } from '../features/students/StudentPage'
import { StudentsPage } from '../features/students/StudentsPage'
import { MarksPage } from '../features/tests/MarksPage'
import { TestsPage } from '../features/tests/TestsPage'
import { OverlayProvider } from '../shared/ui/overlay'
import { AppShell } from './AppShell'

// Providers live inside the router so dialogs can use links and navigation.
function Root() {
  return (
    <ParentDrawerProvider>
      <OverlayProvider>
        <Outlet />
      </OverlayProvider>
    </ParentDrawerProvider>
  )
}

export const routes: RouteObject[] = [
  {
    element: <Root />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
      { path: '/platform', element: <PlatformPage /> },
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <TodayPage /> },
          { path: 'classes', element: <ClassesPage /> },
          { path: 'classes/:batchId', element: <ClassPage /> },
          { path: 'attendance/:sessionId', element: <AttendancePage /> },
          { path: 'students', element: <StudentsPage /> },
          { path: 'students/:studentId', element: <StudentPage /> },
          { path: 'fees/:tab?', element: <FeesPage /> },
          { path: 'tests', element: <TestsPage /> },
          { path: 'tests/:testId', element: <MarksPage /> },
          { path: 'announce/:batchId?', element: <AnnouncePage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'settings/:section?', element: <SettingsPage /> },
          { path: 'account', element: <AccountPage /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]

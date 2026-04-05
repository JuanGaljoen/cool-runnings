'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { sendPasswordReset } from '@/app/login/actions'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? 'Sending…' : 'Send reset link'}
    </Button>
  )
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(sendPasswordReset, { error: null, sent: false })

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.sent ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If an account exists for that email, a reset link has been sent. Check your inbox.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
              <SubmitButton />
              <div className="text-center">
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

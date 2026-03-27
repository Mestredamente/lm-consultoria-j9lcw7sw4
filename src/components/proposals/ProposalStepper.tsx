import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProposalStepper({ step }: { step: number }) {
  const steps = ['Cliente', 'Serviços', 'Custos', 'Resumo']

  return (
    <div className="flex items-center justify-between mb-6 px-2 sm:px-6 md:px-12">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center w-full first:w-auto">
          <div className="flex flex-col items-center gap-2 relative z-10">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors duration-300',
                step === i + 1
                  ? 'border-primary bg-primary text-primary-foreground shadow-md'
                  : step > i + 1
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted-foreground/30 bg-background text-muted-foreground',
              )}
            >
              {step > i + 1 ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
            </div>
            <span
              className={cn(
                'text-xs font-medium hidden sm:block absolute -bottom-5 whitespace-nowrap',
                step >= i + 1 ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </div>
          {i < 3 && (
            <div
              className={cn(
                'h-[2px] w-full mx-2 transition-colors duration-300',
                step > i + 1 ? 'bg-primary' : 'bg-muted',
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

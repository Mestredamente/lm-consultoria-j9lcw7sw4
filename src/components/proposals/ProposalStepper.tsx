import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

export function ProposalStepper({ step }: { step: number }) {
  const steps = ['Cliente', 'Serviços', 'Custos', 'Resumo']
  const isMobile = useIsMobile()

  return (
    <div className="flex flex-col mb-2">
      {isMobile && (
        <div className="flex items-center justify-between px-2 mb-4 w-full">
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-black h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div
        className={cn(
          'flex items-center justify-between w-full',
          isMobile ? 'px-2' : 'px-6 md:px-12',
        )}
      >
        {steps.map((label, i) => (
          <div
            key={label}
            className={cn('flex items-center', i < 3 ? 'w-full' : 'w-auto')}
          >
            <div className="flex flex-col items-center gap-2 relative z-10">
              <div
                className={cn(
                  'flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full border-2 text-sm md:text-base font-bold transition-all duration-300',
                  step === i + 1
                    ? 'border-black bg-black text-white shadow-md transform scale-110'
                    : step > i + 1
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white text-gray-400',
                )}
              >
                {step > i + 1 ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
              </div>

              {!isMobile && (
                <span
                  className={cn(
                    'text-sm font-semibold absolute -bottom-6 whitespace-nowrap transition-colors duration-300',
                    step >= i + 1 ? 'text-black' : 'text-gray-400',
                  )}
                >
                  {label}
                </span>
              )}
            </div>
            {i < 3 && (
              <div
                className={cn(
                  'h-[2px] w-full mx-2 transition-colors duration-300',
                  step > i + 1 ? 'bg-black' : 'bg-gray-200',
                )}
              />
            )}
          </div>
        ))}
      </div>

      {isMobile && (
        <div className="mt-4 text-center">
          <span className="font-semibold text-gray-900 text-lg">
            {steps[step - 1]}
          </span>
        </div>
      )}
    </div>
  )
}

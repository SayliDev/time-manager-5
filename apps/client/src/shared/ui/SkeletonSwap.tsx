import { useState, type AnimationEvent, type ReactNode } from 'react';

interface SkeletonSwapProps {
  isLoading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Fondu enchaîné entre un skeleton et le contenu réel.
 *
 * Les deux calques sont superposés dans la même cellule de grille : quand le
 * chargement se termine, le skeleton s'efface pendant que le contenu apparaît,
 * puis le skeleton est démonté à la fin de son animation.
 */
export function SkeletonSwap({
  isLoading,
  skeleton,
  children,
  className = '',
}: SkeletonSwapProps) {
  const [skeletonMounted, setSkeletonMounted] = useState(isLoading);

  // Un nouveau chargement remonte le skeleton (ajustement pendant le rendu,
  // sans effet ni rendu intermédiaire).
  if (isLoading && !skeletonMounted) {
    setSkeletonMounted(true);
  }

  const handleFadeOutEnd = (event: AnimationEvent<HTMLDivElement>) => {
    // Ignore les animations des enfants (shimmer des skeletons) qui remontent.
    if (event.target === event.currentTarget) {
      setSkeletonMounted(false);
    }
  };

  return (
    <div aria-busy={isLoading} className={`grid ${className}`}>
      {skeletonMounted ? (
        <div
          aria-hidden
          className={`pointer-events-none col-start-1 row-start-1 ${
            isLoading ? '' : 'tm-fade-out'
          }`}
          onAnimationEnd={handleFadeOutEnd}
        >
          {skeleton}
        </div>
      ) : null}
      {isLoading ? null : (
        <div className='tm-fade-in col-start-1 row-start-1 min-w-0'>
          {children}
        </div>
      )}
    </div>
  );
}

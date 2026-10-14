import Link from 'next/link';
import { type ElementType } from 'react';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from './breadcrumbs';

interface ModulePlaceholderProps {
  moduleName: string;
  targetPhase: string;
  icon: ElementType;
  description: string;
  plannedFeatures: string[];
}

export function ModulePlaceholder({
  moduleName,
  targetPhase,
  icon: Icon,
  description,
  plannedFeatures,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: moduleName, current: true }]} />

      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Badge variant="warning" size="md">
          {targetPhase}
        </Badge>
      </div>

      <Card className="max-w-3xl">
        <CardHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal/10 text-teal">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-text-primary">
                {moduleName} Module
              </CardTitle>
              <p className="text-xs text-text-secondary mt-1">{description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="rounded-lg border border-info/30 bg-info-light/40 p-4 text-xs text-blue-950 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-info">
              <Sparkles className="h-4 w-4" />
              Architectural Readiness Status
            </div>
            <p className="leading-relaxed">
              Domain boundary definitions (`src/modules/{moduleName.toLowerCase()}`) and preliminary
              database table schemas were established in Phase 1. Complete UI workflows, API
              endpoints, and Supabase database interactions will be implemented when {targetPhase}{' '}
              begins.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">
              Planned Core Capabilities:
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {plannedFeatures.map((feat, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs text-text-secondary rounded-lg border border-border/80 bg-page-bg/60 p-2.5"
                >
                  <CheckCircle2 className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

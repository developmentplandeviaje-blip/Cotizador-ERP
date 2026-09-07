<?php

namespace App\Services\Catalog;

use App\Models\User;

class PricingEngine
{
    public const DEFAULT_FREELANCER_MARKUP = 15.00;

    /**
     * Determine whether net costs should be strictly hidden for the given user.
     * Per US-03, Freelancers must NEVER see supplier net costs.
     */
    public function shouldHideNetCosts(?User $user): bool
    {
        if (!$user) {
            return true;
        }

        return $user->level === 'Freelancer';
    }

    /**
     * Calculate selling price applying the freelancer markup.
     * Formula: Precio Venta = Tarifa Base + (Tarifa Base * %Markup / 100)
     */
    public function calculateSellingPrice(float $basePrice, float $markupPercentage = self::DEFAULT_FREELANCER_MARKUP): float
    {
        if ($basePrice <= 0) {
            return 0.00;
        }

        $markup = ($basePrice * $markupPercentage) / 100.0;
        return round($basePrice + $markup, 2);
    }

    /**
     * Sanitize and format a rate object according to user permissions.
     */
    public function formatRateForUser(array $rateData, ?User $user): array
    {
        $hideCosts = $this->shouldHideNetCosts($user);

        if ($hideCosts) {
            // Apply markup to base selling prices
            $rateData['precio_noche_adulto'] = $this->calculateSellingPrice(
                (float) ($rateData['precio_noche_adulto'] ?? 0)
            );
            $rateData['precio_noche_adolescente'] = $this->calculateSellingPrice(
                (float) ($rateData['precio_noche_adolescente'] ?? 0)
            );
            $rateData['precio_noche_nino'] = $this->calculateSellingPrice(
                (float) ($rateData['precio_noche_nino'] ?? 0)
            );

            // Strip net costs strictly
            unset(
                $rateData['costo_noche_adulto'],
                $rateData['costo_noche_adolescente'],
                $rateData['costo_noche_nino'],
                $rateData['porcentaje_adulto'],
                $rateData['porcentaje_adolescente'],
                $rateData['porcentaje_nino']
            );
        }

        return $rateData;
    }
}

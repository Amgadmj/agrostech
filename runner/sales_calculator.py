# Agrostech — Sales Calculator
# Versão: 2.0 (Enterprise & SME) — agora alimentada pelo Deal Desk (Conselho Financeiro)
# Calcula orçamentos para pequenos produtores até mega-corporações (Raízen, Cargill, São Martinho)
#
# v2.0: todo preço passa pelo piso de margem do modelo de custos real
# (knowledge-base/UNIT_ECONOMICS.md via runner/deal_desk.py). As tabelas por faixa
# continuam sendo o preço de VALOR; o piso garante que nunca cotamos no prejuízo —
# na v1.0 os tiers de mega-contrato (R$14–22/ha) estavam ABAIXO do break-even real.

import math

try:
    from deal_desk import price_floor_per_ha, MARGIN_HEALTHY
except ImportError:
    # Fallback standalone: espelha o CostModel (piloto 11,50 + logística 4,00 +
    # processamento 1,90/produto/voo; imposto 15%; margem saudável 25%)
    MARGIN_HEALTHY = 0.25

    def price_floor_per_ha(flights, products, area_ha=0.0, margin=MARGIN_HEALTHY):
        pilot, logistics = (10.0, 3.0) if area_ha >= 10_000 else (11.50, 4.00)
        if 5_000 <= area_ha < 10_000:
            logistics = 3.0
        cogs = (pilot + logistics) * flights + 1.90 * products * flights
        return cogs / (1 - 0.15 - margin)


class AgrostechSalesCalculator:
    def __init__(self):
        self.min_ortofoto = 3500
        self.min_ndvi = 5000

    @staticmethod
    def _floor_guard(price_per_ha, flights, products, area_ha):
        """Nunca cotar abaixo do piso de margem saudável do Conselho Financeiro."""
        floor = price_floor_per_ha(flights, products, area_ha)
        return max(price_per_ha, math.ceil(floor))

    def get_ortofoto_price(self, area_ha):
        # Ortofoto RGB = 1 voo × 1 produto
        if area_ha <= 200:
            price_per_ha = 40
        elif area_ha <= 500:
            price_per_ha = 35
        elif area_ha <= 1000:
            price_per_ha = 30
        elif area_ha <= 3000:
            price_per_ha = 28
        elif area_ha <= 10000:
            price_per_ha = 26  # Escala corporativa
        else:
            price_per_ha = 25  # Mega-contrato (> 10.000 ha) — piso garante margem

        price_per_ha = self._floor_guard(price_per_ha, 1, 1, area_ha)
        return max(self.min_ortofoto, area_ha * price_per_ha)

    def get_ndvi_price(self, area_ha):
        # NDVI Multiespectral = 1 voo × 2 produtos (RGB + multiespectral)
        if area_ha <= 200:
            price_per_ha = 60
        elif area_ha <= 500:
            price_per_ha = 50
        elif area_ha <= 1000:
            price_per_ha = 42
        elif area_ha <= 3000:
            price_per_ha = 38
        elif area_ha <= 10000:
            price_per_ha = 34  # Escala corporativa
        else:
            price_per_ha = 30  # Mega-contrato

        price_per_ha = self._floor_guard(price_per_ha, 1, 2, area_ha)
        return max(self.min_ndvi, area_ha * price_per_ha)

    def get_pacote_completo_price(self, area_ha):
        # Ortofoto + NDVI + MDE = 1 voo × 3 produtos
        if area_ha <= 200:
            price_per_ha = 75
        elif area_ha <= 500:
            price_per_ha = 62
        elif area_ha <= 1000:
            price_per_ha = 52
        elif area_ha <= 3000:
            price_per_ha = 45
        elif area_ha <= 10000:
            price_per_ha = 40
        else:
            price_per_ha = 38

        price_per_ha = self._floor_guard(price_per_ha, 1, 3, area_ha)
        return area_ha * price_per_ha

    def calculate_enterprise_contract(self, area_ha, farms_count, is_recurring_annual=True):
        """
        Para contas como Raízen, Cargill, São Martinho.
        Combina Pacote Completo recorrente com auditoria de produção por fazenda.
        """
        pacote = self.get_pacote_completo_price(area_ha)

        # Auditoria de produção + laudo técnico (por fazenda)
        audit_per_farm = 25000
        total_audit = audit_per_farm * farms_count

        flights_per_year = 4 if is_recurring_annual else 1
        annual_total = pacote * flights_per_year + total_audit

        # Desconto executivo para grandes volumes (15%) — limitado ao piso de margem
        if annual_total > 500000:
            discount = 0.15
        elif annual_total > 100000:
            discount = 0.10
        else:
            discount = 0.0

        # O desconto não pode furar o piso: recalcula o mínimo defensável
        floor_total = (
            price_floor_per_ha(1, 3, area_ha) * area_ha * flights_per_year + total_audit
        )
        final_price = max(annual_total * (1 - discount), floor_total)
        return {
            "area_total_ha": area_ha,
            "numero_fazendas": farms_count,
            "valor_bruto_anual": annual_total,
            "desconto_aplicado": f"{discount * 100}%",
            "valor_final_anual": final_price,
            "economia": annual_total - final_price
        }

    def simulate_proposal(self, area_ha, service_type="completo", is_enterprise=False, farms=1):
        if is_enterprise:
            return self.calculate_enterprise_contract(area_ha, farms)

        if service_type == "ortofoto":
            return {"servico": "Ortofoto RGB", "area_ha": area_ha, "valor": self.get_ortofoto_price(area_ha)}
        elif service_type == "ndvi":
            return {"servico": "NDVI Multiespectral", "area_ha": area_ha, "valor": self.get_ndvi_price(area_ha)}
        else:
            return {"servico": "Pacote Completo", "area_ha": area_ha, "valor": self.get_pacote_completo_price(area_ha)}


if __name__ == "__main__":
    calc = AgrostechSalesCalculator()
    print("--- Simulação de Contrato Enterprise (ex: Raízen, 50.000 ha, 10 fazendas) ---")
    print(calc.simulate_proposal(50000, is_enterprise=True, farms=10))
    print("\n--- Simulação PME (Fazenda 300 ha, NDVI) ---")
    print(calc.simulate_proposal(300, service_type="ndvi"))
    print("\n--- Mega-contrato Ortofoto (30.000 ha) — piso do Conselho aplicado ---")
    print(calc.simulate_proposal(30000, service_type="ortofoto"))

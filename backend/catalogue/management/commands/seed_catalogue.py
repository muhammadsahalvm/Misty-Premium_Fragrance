from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from catalogue.models import Category, Product, ProductImage, ProductVariant


CATEGORIES = {
    "woody": "Woody",
    "floral": "Floral",
    "fresh": "Fresh",
    "oriental": "Oriental",
}

PRODUCTS = [
    {
        "slug": "the-tragedy-of-lord-george",
        "name": "The Tragedy of Lord George",
        "category": "woody",
        "description": "A polished, ambered wood composition with cedar, rum and a warm, intimate finish.",
        "short_description": "Polished woods with an ambered warmth.",
        "fragrance_family": "Woody",
        "notes": ("Cedar", "Rum", "Amber"),
        "image": "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1200&q=85",
        "base_price": Decimal("8950.00"),
    },
    {
        "slug": "oud-essence",
        "name": "Oud Essence",
        "category": "woody",
        "description": "Dark oud softened by sandalwood and a subtle veil of spice.",
        "short_description": "Dark oud softened by sandalwood.",
        "fragrance_family": "Woody",
        "notes": ("Saffron", "Oud", "Sandalwood"),
        "image": "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=1200&q=85",
        "base_price": Decimal("10950.00"),
    },
    {
        "slug": "blanche",
        "name": "Blanche",
        "category": "floral",
        "description": "A luminous floral study of clean petals, soft musk and freshly laundered skin.",
        "short_description": "Luminous petals and soft musk.",
        "fragrance_family": "Floral",
        "notes": ("Aldehydes", "Rose", "Musk"),
        "image": "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=1200&q=85",
        "base_price": Decimal("7250.00"),
    },
    {
        "slug": "rose-eternelle",
        "name": "Rose Éternelle",
        "category": "floral",
        "description": "Velvety rose illuminated with peony and grounded by a quiet amber trail.",
        "short_description": "Velvety rose with a quiet amber trail.",
        "fragrance_family": "Floral",
        "notes": ("Peony", "Damask Rose", "Amber"),
        "image": "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=1200&q=85",
        "base_price": Decimal("7950.00"),
    },
    {
        "slug": "aqua",
        "name": "Aqua",
        "category": "fresh",
        "description": "A clear, mineral freshness carried by citrus peel, sea air and pale woods.",
        "short_description": "Mineral freshness and bright citrus.",
        "fragrance_family": "Fresh",
        "notes": ("Bergamot", "Sea Salt", "Pale Woods"),
        "image": "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=1200&q=85",
        "base_price": Decimal("6450.00"),
    },
    {
        "slug": "citrus-bloom",
        "name": "Citrus Bloom",
        "category": "fresh",
        "description": "Sparkling mandarin and neroli unfold into a bright, effortless daily scent.",
        "short_description": "Sparkling citrus with a neroli heart.",
        "fragrance_family": "Fresh",
        "notes": ("Mandarin", "Neroli", "White Musk"),
        "image": "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=1200&q=85",
        "base_price": Decimal("6850.00"),
    },
    {
        "slug": "amber-noir",
        "name": "Amber Noir",
        "category": "oriental",
        "description": "A rich amber composition woven with incense, vanilla and dark resinous woods.",
        "short_description": "Rich amber, incense and dark woods.",
        "fragrance_family": "Oriental",
        "notes": ("Incense", "Amber", "Vanilla"),
        "image": "https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=1200&q=85",
        "base_price": Decimal("9250.00"),
    },
    {
        "slug": "santal",
        "name": "Santal",
        "category": "oriental",
        "description": "Creamy sandalwood and cardamom settle into a smooth, enveloping skin scent.",
        "short_description": "Creamy sandalwood with cardamom.",
        "fragrance_family": "Oriental",
        "notes": ("Cardamom", "Sandalwood", "Tonka"),
        "image": "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1200&q=85",
        "base_price": Decimal("8750.00"),
    },
]


class Command(BaseCommand):
    help = "Create or update the initial Misty catalogue seed data."

    @transaction.atomic
    def handle(self, *args, **options):
        categories = {}
        for slug, name in CATEGORIES.items():
            category, _ = Category.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "description": f"{name} fragrances from the Misty house.",
                    "is_active": True,
                },
            )
            categories[slug] = category

        for item in PRODUCTS:
            product, _ = Product.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "name": item["name"],
                    "category": categories[item["category"]],
                    "description": item["description"],
                    "short_description": item["short_description"],
                    "fragrance_family": item["fragrance_family"],
                    "concentration": "EDP",
                    "gender": "Unisex",
                    "top_notes": item["notes"][0],
                    "middle_notes": item["notes"][1],
                    "base_notes": item["notes"][2],
                    "is_featured": True,
                    "is_active": True,
                },
            )

            for size_ml, multiplier, stock in (
                (50, Decimal("1.00"), 24),
                (100, Decimal("1.45"), 12),
            ):
                sku = f"MST-{item['slug'].upper()}-{size_ml}"
                ProductVariant.objects.update_or_create(
                    sku=sku,
                    defaults={
                        "product": product,
                        "size_ml": size_ml,
                        "price": item["base_price"] * multiplier,
                        "compare_at_price": None,
                        "stock_quantity": stock,
                        "is_active": True,
                    },
                )

            ProductImage.objects.filter(product=product).update(is_primary=False)
            ProductImage.objects.update_or_create(
                product=product,
                sort_order=0,
                defaults={
                    "image_url": item["image"],
                    "alt_text": f"{item['name']} perfume bottle",
                    "is_primary": True,
                },
            )

        self.stdout.write(self.style.SUCCESS("Seeded 4 categories, 8 products, 16 variants, and 8 primary images."))

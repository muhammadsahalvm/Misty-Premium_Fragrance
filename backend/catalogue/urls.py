"""
URL configuration for the catalogue app.
"""

from django.urls import path

from . import views

app_name = "catalogue"

urlpatterns = [
    path("categories/", views.CategoryListView.as_view(), name="category-list"),
    path("collections/", views.CollectionListView.as_view(), name="collection-list"),
    path("products/", views.ProductListView.as_view(), name="product-list"),
    path("products/<slug:slug>/", views.ProductDetailView.as_view(), name="product-detail"),
]


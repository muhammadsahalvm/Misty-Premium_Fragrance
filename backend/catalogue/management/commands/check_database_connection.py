from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import DatabaseError, connection


class Command(BaseCommand):
    help = "Check the configured database connection without exposing credentials."

    def handle(self, *args, **options):
        database = settings.DATABASES["default"]
        connection_options = database.get("OPTIONS", {})
        ssl_mode = connection_options.get("ssl_mode", "disabled")

        self.stdout.write(
            f"Checking {database['ENGINE']} at "
            f"{database.get('HOST') or '<default>'}:{database.get('PORT') or '<default>'} "
            f"for database {database.get('NAME')!r} with TLS {ssl_mode}."
        )

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except DatabaseError as exc:
            error_code = exc.args[0] if exc.args and isinstance(exc.args[0], int) else "unknown"
            raise CommandError(
                f"Database connection failed ({type(exc).__name__}, code {error_code})."
            ) from exc

        self.stdout.write(self.style.SUCCESS("Database connection succeeded."))

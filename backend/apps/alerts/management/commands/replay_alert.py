from django.core.management.base import BaseCommand, CommandError
from apps.transactions.models import Transaction
from apps.alerts.queue import publish
from apps.alerts.service import event_for


class Command(BaseCommand):
    help = "Republish a committed transaction by UUID after a publication failure."

    def add_arguments(self, parser):
        parser.add_argument("transaction_id")

    def handle(self, *args, **options):
        tx = Transaction.objects.get(pk=options["transaction_id"])
        if not publish(event_for(tx)):
            raise CommandError("Publication failed; inspect structured logs")
        self.stdout.write("Event published")

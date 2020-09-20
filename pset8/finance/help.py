from cs50 import SQL
from helpers import apology, login_required, lookup, usd

db = SQL("sqlite:///finance.db")

rows = db.execute("SELECT * FROM buys WHERE person_id = 1")
    
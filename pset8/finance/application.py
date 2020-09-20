import os

from cs50 import SQL
from flask import Flask, flash, jsonify, redirect, render_template, request, session
from flask_session import Session
from tempfile import mkdtemp
from werkzeug.exceptions import default_exceptions, HTTPException, InternalServerError
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import apology, login_required, lookup, usd

# Configure application
app = Flask(__name__)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Ensure responses aren't cached
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

# Custom filter
app.jinja_env.filters["usd"] = usd

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///finance.db")

# Make sure API key is set
if not os.environ.get("API_KEY"):
    raise RuntimeError("API_KEY not set")


@app.route("/")
@login_required
def index():
    """Show portfolio of stocks"""
    
    user_id = session['user_id']
    # get info about current users stock profile
    buys = db.execute("SELECT symbol, shares, trType FROM buys WHERE person_id = :user_id AND trType = :trType",user_id=user_id, trType="Buy")
    sells = db.execute("SELECT symbol, shares, trType FROM buys WHERE person_id = :user_id AND trType = :trType", user_id=user_id, trType="Sell")
    # create dictionary with total number of shares
    shareInfo = {}
    for i in buys:
        if i['symbol'] not in shareInfo:
            shareInfo[i['symbol']] = i['shares']
        else:
            shareInfo[i['symbol']] += i['shares']
    
    for i in sells:
        shareInfo[i['symbol']] = -1 * i['shares']
    # create list with shares prices
    sharePrice = []
    for i in shareInfo.keys():
        sharePrice.append(lookup(i))
    
    # create final list
    finalList = []
    total = 0
    for i in shareInfo:    
        fin = {}
        fin['symbol'] = i.upper()
        fin['shares'] = shareInfo[i]
        for j in sharePrice:
            if j['symbol'].lower() == fin['symbol'].lower():
                fin['name'] = j['name']
                fin['price'] = usd(j['price'])
                fin['total'] = usd(j['price'] * float(fin['shares']))
                if fin['shares'] <= 0:
                    break
                total += j['price'] * fin['shares']
                break
            
        if fin['shares'] > 0:
            finalList.append(fin)
        
    cash = db.execute("SELECT cash FROM users WHERE id = :user_id", user_id=user_id)
    total += cash[0]['cash']
            
    return render_template("index.html", finalList = finalList, total=usd(total), cash=usd(cash[0]['cash']))


@app.route("/buy", methods=["GET", "POST"])
@login_required
def buy():
    """Buy shares of stock"""

    # check method
    if request.method == "POST":

        # load dictionary of stock info
        shares = lookup(request.form.get("symbol"))
        symbol = request.form.get("symbol")
        numShares = request.form.get("shares")
        user_id = session["user_id"]

        # check if field is empty or not
        if not symbol or not numShares:
            return apology("Missing Field", 403)
        # check whether if symbol is found
        elif shares == None:
            return apology("Symbol Not Found", 403)
        # check whether number of shares is greater than 0
        elif int(numShares) <= 0:
            return apology("Shares must be greater than 0", 403)

        # determine the amount the shares cost
        shareCost = float(numShares) * float(shares["price"])

        # determine whether user can actually purchase the number of shares they input
        userAmount = db.execute("SELECT cash FROM users WHERE id = :user_id", user_id = user_id)

        # determine if user can buy the shares
        if float(userAmount[0]['cash']) < shareCost:
            return apology("You don't have the facilities for this big man", 403)
        else:
            finalAmount = float(userAmount[0]['cash']) - shareCost
            # add transaction into sql table and update cash
            db.execute("INSERT INTO buys (person_id, symbol, shares, price, trType) VALUES (:user_id, :symbol, :shares, :price, :trType)", user_id=user_id, symbol=symbol, shares=numShares, price=shares['price'], trType="Buy")
            db.execute("UPDATE users SET cash = :cash WHERE id = :user_id", cash=finalAmount, user_id=user_id)
            # redirect to index
            return redirect("/")
    else:
        return render_template("buy.html")


@app.route("/history")
@login_required
def history():
    """Show history of transactions"""
    
    user_id = session['user_id']
    rows = db.execute("SELECT * FROM buys WHERE person_id = :user_id", user_id=user_id)
    
    return render_template("history.html", rows = rows)


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":

        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("must provide username", 403)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("must provide password", 403)

        # Query database for username
        rows = db.execute("SELECT * FROM users WHERE username = :username",
                          username=request.form.get("username"))

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(rows[0]["hash"], request.form.get("password")):
            return apology("invalid username and/or password", 403)

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirect user to home page
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")


@app.route("/quote", methods=["GET", "POST"])
@login_required
def quote():
    """Get stock quote."""

    # check method
    if request.method == "POST":
        # get dictionary of information from API
        share = lookup(request.form.get("symbol"))

        # check if lookup returned anything
        if share == None:
            return render_template("quote.html")
        else:
            return render_template("quoted.html", name=share["name"], price=usd(share["price"]), symbol=share["symbol"])
    else:
        return render_template("quote.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    """Register user"""

    # check method
    if request.method == "POST":
        # check if username is there or already taken
        # query database for username
        rows = db.execute("SELECT * FROM users WHERE username = :username", username=request.form.get("username"))
        if not request.form.get("username") or len(rows) != 0:
            return apology("Username taken or not there", 403)
        # check if passwords match or are both there
        elif not request.form.get("password") or not request.form.get("confirmation") or request.form.get("password") != request.form.get("confirmation"):
            return apology("Password do not match or missing field", 403)

        # insert username and hashed password into sql database
        db.execute("INSERT INTO users (username, hash) VALUES(?, ?)", request.form.get("username"), generate_password_hash(request.form.get("password")))

        # remember user is in session
        rows = db.execute("SELECT * FROM users WHERE username = :username", username=request.form.get("username"))
        session["user_id"] = rows[0]["id"]

        # redirect user to index
        return redirect("/")
    else:
        return render_template("register.html")


@app.route("/sell", methods=["GET", "POST"])
@login_required
def sell():
    """Sell shares of stock"""
    # get info
    user_id = session["user_id"]
    symbols = db.execute("SELECT symbol FROM buys WHERE person_id = :user_id", user_id=user_id)
    symbolList = []
    for symbol in symbols:
        if symbol['symbol'].upper() not in symbolList:
            symbolList.append(symbol['symbol'].upper())
            
    # check method
    if request.method == "POST":
        # get symbol and shares from webpage
        sym = request.form.get("symbol")
        shares = request.form.get("shares")
        
        # check whether user did it correctly
        if not sym or not shares:
            return apology("Need to select a symbol or shares", 403)
        elif int(shares) < 0:
            return apology("Shares need to be greater than ")
        totalShares = db.execute("SELECT SUM(shares) FROM buys WHERE person_id = :user_id AND symbol =:symbol", user_id=user_id, symbol=sym.lower())
        if totalShares[0]['SUM(shares)'] < int(shares):
            return apology("You do not have this many shares", 403)
            
        cash = db.execute("SELECT cash FROM users WHERE id=:user_id", user_id=user_id)
        sellShare = lookup(sym)
        cash[0]['cash'] += sellShare['price'] * float(shares)
        db.execute("INSERT INTO buys (person_id, symbol, shares, price, trType) VALUES (:user_id, :symbol, :shares, :price, :trType)", user_id=user_id, symbol=sym.lower(), shares=shares, price=sellShare['price'], trType="Sell")
        db.execute("UPDATE users SET cash = :cash WHERE id = :user_id", cash = cash[0]['cash'], user_id=user_id)
        return redirect("/")
    else:
        return render_template("sell.html", sym=symbolList)
    


def errorhandler(e):
    """Handle error"""
    if not isinstance(e, HTTPException):
        e = InternalServerError()
    return apology(e.name, e.code)


# Listen for errors
for code in default_exceptions:
    app.errorhandler(code)(errorhandler)

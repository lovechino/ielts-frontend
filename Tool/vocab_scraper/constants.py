"""
Constants for the Vocabulary Scraper Tool.
"""

DICT_API = "https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
OXFORD_CSV_URL = "https://raw.githubusercontent.com/chunzhng/Oxford-3000-5000/master/oxford-5000.csv"
VALID_LEVELS = ["A1", "A2", "B1", "B2", "C1"]
MAX_RETRIES = 3
RETRY_DELAY = 2.0  # seconds between retries on error

TOPIC_MAP: dict[str, str] = {
    # Food & Drink
    "eat": "Food", "drink": "Food", "food": "Food", "water": "Food",
    "milk": "Food", "bread": "Food", "rice": "Food", "meat": "Food",
    "fish": "Food", "egg": "Food", "fruit": "Food", "vegetable": "Food",
    "apple": "Food", "banana": "Food", "orange": "Food", "coffee": "Food",
    "tea": "Food", "sugar": "Food", "salt": "Food", "soup": "Food",
    "cook": "Food", "recipe": "Food", "meal": "Food", "snack": "Food",
    "diet": "Food", "nutrition": "Food", "ingredient": "Food",
    # Family
    "family": "Family", "father": "Family", "mother": "Family",
    "brother": "Family", "sister": "Family", "son": "Family",
    "daughter": "Family", "husband": "Family", "wife": "Family",
    "baby": "Family", "child": "Family", "parent": "Family",
    "grandparent": "Family", "grandfather": "Family", "grandmother": "Family",
    "uncle": "Family", "aunt": "Family", "cousin": "Family",
    # Education
    "learn": "Education", "study": "Education", "read": "Education",
    "write": "Education", "book": "Education", "school": "Education",
    "teacher": "Education", "student": "Education", "lesson": "Education",
    "class": "Education", "test": "Education", "exam": "Education",
    "university": "Education", "degree": "Education", "course": "Education",
    "research": "Education", "project": "Education", "science": "Education",
    "history": "Education", "subject": "Education", "grade": "Education",
    "certificate": "Education", "qualification": "Education",
    "knowledge": "Education", "skill": "Education", "training": "Education",
    # Technology
    "internet": "Technology", "website": "Technology", "email": "Technology",
    "software": "Technology", "device": "Technology", "screen": "Technology",
    "keyboard": "Technology", "download": "Technology", "upload": "Technology",
    "app": "Technology", "online": "Technology", "digital": "Technology",
    "computer": "Technology", "phone": "Technology", "algorithm": "Technology",
    "artificial": "Technology", "automation": "Technology",
    "cybersecurity": "Technology", "innovation": "Technology",
    # Environment
    "environment": "Environment", "pollution": "Environment",
    "climate": "Environment", "energy": "Environment", "recycle": "Environment",
    "waste": "Environment", "natural": "Environment", "forest": "Environment",
    "ocean": "Environment", "species": "Environment", "global": "Environment",
    "carbon": "Environment", "emission": "Environment", "drought": "Environment",
    "ecosystem": "Environment", "biodiversity": "Environment",
    "conservation": "Environment", "sustainable": "Environment",
    # Business & Economics
    "management": "Business", "employee": "Business", "employer": "Business",
    "customer": "Business", "service": "Business", "marketing": "Business",
    "finance": "Business", "investment": "Business", "profit": "Business",
    "competition": "Business", "industry": "Business", "trade": "Business",
    "export": "Business", "import": "Business", "contract": "Business",
    "entrepreneur": "Business", "revenue": "Business", "budget": "Business",
    "inflation": "Business", "recession": "Business", "tariff": "Business",
    # Health
    "health": "Health", "symptom": "Health", "treatment": "Health",
    "patient": "Health", "surgery": "Health", "disease": "Health",
    "infection": "Health", "prevent": "Health", "cure": "Health",
    "recover": "Health", "exercise": "Health", "stress": "Health",
    "mental": "Health", "physical": "Health", "diagnosis": "Health",
    "vaccination": "Health", "chronic": "Health", "therapy": "Health",
    "epidemic": "Health", "pandemic": "Health", "medicine": "Health",
    # Society & Politics
    "society": "Society", "community": "Society", "population": "Society",
    "government": "Society", "policy": "Society", "law": "Society",
    "rights": "Society", "freedom": "Society", "equality": "Society",
    "justice": "Society", "culture": "Society", "tradition": "Society",
    "democracy": "Society", "inequality": "Society", "discrimination": "Society",
    "globalization": "Society", "nationalism": "Society", "corruption": "Society",
    # Time
    "day": "Time", "week": "Time", "month": "Time", "year": "Time",
    "today": "Time", "tomorrow": "Time", "yesterday": "Time",
    "morning": "Time", "afternoon": "Time", "evening": "Time",
    "night": "Time", "hour": "Time", "minute": "Time",
    # Colors
    "red": "Colors", "blue": "Colors", "green": "Colors",
    "black": "Colors", "white": "Colors", "yellow": "Colors",
    "orange": "Colors", "purple": "Colors", "brown": "Colors",
    "pink": "Colors", "grey": "Colors",
    # Body
    "head": "Body", "eye": "Body", "ear": "Body", "nose": "Body",
    "mouth": "Body", "hand": "Body", "arm": "Body", "leg": "Body",
    "foot": "Body", "face": "Body", "hair": "Body", "body": "Body",
    "teeth": "Body", "neck": "Body", "shoulder": "Body",
    # Nature
    "head": "Body", "eye": "Body", "ear": "Body", "nose": "Body", # fixed duplicate body part entries if any, though source had them
    "sun": "Nature", "moon": "Nature", "star": "Nature", "tree": "Nature",
    "flower": "Nature", "sea": "Nature", "sky": "Nature", "rain": "Nature",
    "snow": "Nature", "wind": "Nature", "animal": "Nature",
    "cat": "Nature", "dog": "Nature", "bird": "Nature", "horse": "Nature",
    # Travel & Transport
    "car": "Travel", "bus": "Travel", "train": "Travel", "plane": "Travel",
    "bike": "Travel", "ticket": "Travel", "vacation": "Travel",
    "holiday": "Travel", "tourist": "Travel", "destination": "Travel",
    "passport": "Travel", "visa": "Travel", "luggage": "Travel",
    "accommodation": "Travel", "hotel": "Travel", "airport": "Travel",
    # Psychology & Emotions
    "anxiety": "Psychology", "depression": "Psychology",
    "motivation": "Psychology", "confidence": "Psychology",
    "resilience": "Psychology", "empathy": "Psychology",
    "compassion": "Psychology", "frustration": "Psychology",
    "enthusiasm": "Psychology", "nostalgia": "Psychology",
}

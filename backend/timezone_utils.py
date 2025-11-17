"""
Timezone Utilities
Provides IST (Indian Standard Time) timezone support
"""

from datetime import datetime, timezone, timedelta

# Indian Standard Time (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))


def now_ist():
    """
    Get current datetime in IST
    
    Returns:
        datetime: Current datetime in IST timezone
    """
    return datetime.now(IST)


def to_ist(dt):
    """
    Convert datetime to IST
    
    Args:
        dt: datetime object (naive or aware)
        
    Returns:
        datetime: Datetime in IST timezone
    """
    if dt.tzinfo is None:
        # Naive datetime, assume UTC
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(IST)


def format_ist(dt, format_str="%Y-%m-%d %H:%M:%S"):
    """
    Format datetime in IST
    
    Args:
        dt: datetime object
        format_str: strftime format string
        
    Returns:
        str: Formatted datetime string in IST
    """
    ist_dt = to_ist(dt) if dt.tzinfo else dt.replace(tzinfo=IST)
    return ist_dt.strftime(format_str)

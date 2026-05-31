from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.v1.serializers_domain import UserProfileSerializer
from profiles.models import UserProfile


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def profile(request):
    """Read or update the teacher profile. Target of the SPA onboarding form.

    Google auth does not create a UserProfile, so get-or-create here.
    """
    obj, _ = UserProfile.objects.get_or_create(user=request.user)
    if request.method == "GET":
        return Response(UserProfileSerializer(obj).data)
    serializer = UserProfileSerializer(obj, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)

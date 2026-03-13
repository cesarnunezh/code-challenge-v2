from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from map.models import CommunityArea, RestaurantPermit


class CommunityAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityArea
        fields = []

    def to_representation(self, obj: CommunityArea):
        """
        Supplement each community area object with the number
        of permits issued in the given year.

        e.g. The endpoint /map-data/?year=2017 should return something like:
        [
            {
                "ROGERS PARK": {
                    area_id: 17,
                    num_permits: 2
                },
                "BEVERLY": {
                    area_id: 72,
                    num_permits: 2
                },
                ...
            }
        ]
        """
        year = self.context.get("year")

        if year: 
            query = RestaurantPermit.objects.filter(
            community_area_id=obj.area_id
        )
            
            return {obj.name : {
                'area_id' : obj.area_id,
                'num_permits' : query.count()
                }}
        else:
            raise(ValidationError('Year not specified.'))